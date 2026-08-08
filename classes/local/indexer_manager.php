<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_ai_content\local;

use local_ai_content\source;
use local_ai_manager\local\connector_factory;

// This is required because course_get_format() is in course/lib.php and isn't loaded automatically.
require_once($CFG->dirroot . '/course/lib.php');

/**
 * Manages the indexing of Moodle content into the vector store.
 *
 * Supports module sources (extracted via content processors) and document sources (indexed directly from their
 * stored plain-text content). External sources are never indexed here: their vectors already live in a vector
 * store instance and are only referenced.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class indexer_manager {
    /** @var \context Context the indexing is triggered for. */
    protected \context $context;

    /** @var \local_ai_manager\manager AI manager instance for embedding requests. */
    protected $ai_manager;

    /**
     * Constructor.
     *
     * @param int $contextid Any Moodle context ID (system, category, course or module).
     * @param \local_ai_manager\manager $ai_manager AI manager instance for embedding requests.
     */
    public function __construct($contextid, $ai_manager) {
        $this->context = \context::instance_by_id($contextid);
        $this->ai_manager = $ai_manager;
    }

    /**
     * Index all sources associated with this context that are allowed to be indexed.
     *
     * Module sources are indexed for the course the context belongs to; document sources attached directly to
     * this context are indexed from their stored content.
     */
    public function index(): void {
        // Index module sources if the context belongs to a course.
        $coursecontext = $this->context->get_course_context(false);
        if ($coursecontext) {
            $course = get_course($coursecontext->instanceid);
            [$rawcms, $sources] = source::get_module_sources_for_course($course);

            foreach ($sources as $source) {
                if (!$source->get_allowindex()) {
                    continue;
                }
                $cmid = $source->get_cmid();
                if (!isset($rawcms[$cmid])) {
                    continue;
                }
                $rawcm = $rawcms[$cmid];
                $cm = get_coursemodule_from_id($rawcm->mod, $rawcm->cm, 0, false, MUST_EXIST);
                $processor = $this->get_content_processor($rawcm->mod, $cm);
                if (!$processor) {
                    continue;
                }

                $content = $processor->extract();
                $chunks = method_exists($processor, 'get_chunks') ? $processor->get_chunks($content) : [$content];
                $this->index_source($source, $chunks ?: [$content]);
            }
        }

        // Index document sources attached directly to this context.
        $documentsources = source::get_records_by_contextids([$this->context->id]);
        foreach ($documentsources as $source) {
            if ($source->get_sourcetype() !== source::TYPE_DOCUMENT) {
                continue;
            }
            if (!$source->get_allowindex()) {
                continue;
            }
            $content = (string) $source->get_content();
            if ($content === '') {
                continue;
            }
            $this->index_source($source, [$content]);
        }
    }

    /**
     * Embeds the given content chunks of a source and stores them in the source's vector store instance.
     *
     * Records the used embedding model, the content hash and the indexing timestamp on the source record.
     *
     * @param source $source The source to index.
     * @param string[] $chunks The content chunks to embed and store.
     */
    protected function index_source(source $source, array $chunks): void {
        $chunks = array_values(array_filter(array_map('trim', $chunks), static fn(string $c): bool => $c !== ''));
        if (empty($chunks)) {
            return;
        }

        $sourceid = $source->get_id();
        $maxchunks = count($chunks);
        $embeddingmodel = '';
        $enrichedvectors = [];
        $chunkcount = 1;
        foreach ($chunks as $chunk) {
            $vectorrequest = $this->ai_manager->perform_request($chunk, 'local_ai_content', $this->context->id);
            if ($embeddingmodel === '') {
                $embeddingmodel = $vectorrequest->get_modelinfo();
            }
            $enrichedvectors[] = enriched_vector::create(
                $vectorrequest->get_content(),
                $chunk,
                $sourceid,
                $chunkcount,
                $maxchunks
            );
            $chunkcount++;
        }

        $vecstore = $this->get_vecstore_for_source($source);
        if ($vecstore === null) {
            return;
        }
        $vecstore->insert_embeddings($enrichedvectors);

        // Persist indexing metadata on the source record.
        $clock = \core\di::get(\core\clock::class);
        $source->set_embeddingmodel($embeddingmodel);
        $source->set_contenthash(hash('sha256', implode("\n", $chunks)));
        $source->set_lastindexed($clock->time());
        $source->store();
    }

    /**
     * Resolves the vector store driver a source's vectors should be stored in.
     *
     * Uses the source's explicitly configured vector store instance if present, otherwise falls back to the
     * tenant's primary vector store.
     *
     * @param source $source The source whose target vector store is resolved.
     * @return ?\local_ai_manager\base_vecstore The vector store driver, or null if none is available.
     */
    protected function get_vecstore_for_source(source $source): ?\local_ai_manager\base_vecstore {
        $connectorfactory = \core\di::get(connector_factory::class);
        $vecstoreid = $source->get_vecstoreid();
        if ($vecstoreid) {
            $vecstorefactory = \core\di::get(\local_ai_manager\local\vecstore_factory::class);
            if ($vecstorefactory->instance_exists($vecstoreid)) {
                return $vecstorefactory->get_vecstore_by_id($vecstoreid);
            }
        }
        return $connectorfactory->get_primary_vecstore();
    }

    /**
     * Resolves and instantiates the content processor for the given module type.
     *
     * @param string $modname The module name (e.g. 'resource', 'page').
     * @param \stdClass $cm The course module object.
     * @return object|null The processor instance, or null if none is registered.
     */
    protected function get_content_processor(string $modname, \stdClass $cm): ?object {
        $classname = 'local_ai_content\local\contentprocessor\content_' . $modname;
        if (class_exists($classname)) {
            return new $classname($cm);
        }
        return null;
    }
}

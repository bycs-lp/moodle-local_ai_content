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
 * Manages the indexing of course module content into the vector store.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class indexer_manager {

    /** @var \context Context */
    protected $context;

    /** @var \local_ai_manager\manager AI manager instance for embedding requests. */
    protected $ai_manager;

    /**
     * Constructor.
     *
     * @param int $contextid The course context ID.
     * @param \local_ai_manager\manager $ai_manager AI manager instance for embedding requests.
     */
    public function __construct($contextid, $ai_manager) {
        $this->context = \context::instance_by_id($contextid);
        if ($this->context->contextlevel !== CONTEXT_COURSE) {
            throw new \coding_exception('Context must be a course context.');
        }
        $this->ai_manager = $ai_manager;
    }

    /**
     * Index all course modules that have allowindex = 1.
     */
    public function index(): void {
        $course = get_course($this->context->instanceid);
        [$rawcms, $sources] = source::get_module_sources_for_course($course);

        foreach ($sources as $source) {
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
            $sourceid = $source->get_id();

            if (method_exists($processor, 'get_chunks')) {
                $chunks = $processor->get_chunks($content);
                if ($chunks) {
                    $chunkcount = 1;
                    $maxchunks = count($chunks);
                    $enrichedvectors = [];
                    foreach ($chunks as $chunk) {
                        $vectorrequest = $this->ai_manager->perform_request($chunk, 'local_ai_content', $this->context->id);
                        $enrichedvectors[] = enriched_vector::create(
                            $vectorrequest->get_content(),
                            $chunk,
                            $sourceid,
                            $chunkcount,
                            $maxchunks
                        );
                        $chunkcount++;
                    }
                    \core\di::get(connector_factory::class)->get_primary_vecstore()->insert_embeddings($enrichedvectors);
                }
            } else {
                // Content processor does not support chunking — store as single vector.
                $vectorrequest = $this->ai_manager->perform_request($content, 'local_ai_content', $this->context->id);
                $ev = enriched_vector::create($vectorrequest->get_content(), $content, $sourceid, 1, 1);
                \core\di::get(connector_factory::class)->get_primary_vecstore()->insert_embeddings([$ev]);
            }
        }
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

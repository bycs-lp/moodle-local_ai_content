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
use local_ai_manager\local\vector_record;

/**
 * Manages the indexing of Moodle content into the vector store.
 *
 * Supports module sources (extracted via content extractors) and document sources (indexed directly from their
 * stored plain-text content). External sources are never indexed here: their vectors already live in a vector
 * store instance and are only referenced.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class indexer_manager {
    /** @var int Smallest chunk length that may still be retried with a split. */
    protected const MIN_RETRYABLE_CHUNK_LENGTH = 200;

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
     * Indexes one source with the embedding model of an index.
     *
     * The embedding requests are made with the AI manager passed to the constructor, which has to use the embedding model
     * of the index. Every case in which nothing could be indexed is an error, so a source is never reported as indexed
     * without having vectors.
     *
     * @param source $source The source to index.
     * @param model_index $index The index of the source for the embedding model, updated with the indexing metadata.
     * @throws \moodle_exception If the source cannot be indexed.
     */
    public function index_single_source(source $source, model_index $index): void {
        if (!$source->get_allowindex()) {
            return;
        }

        $this->index_source($source, $index, \core\di::get(source_content_reader::class)->get_chunks($source));
    }

    /**
     * Embeds the given content chunks of a source and stores them in the collection of the embedding model.
     *
     * Records the content hash and the indexing timestamp on the index record.
     *
     * @param source $source The source to index.
     * @param model_index $index The index of the source for the embedding model.
     * @param string[] $chunks The content chunks to embed and store, as returned by {@see source_content_reader::get_chunks()}.
     * @throws \moodle_exception If there is no content to index or an embedding request fails.
     */
    protected function index_source(source $source, model_index $index, array $chunks): void {
        if (empty($chunks)) {
            throw new \moodle_exception('indexingerror_nocontent', 'local_ai_content');
        }

        $sourceid = $source->get_id();
        $vecstore = $this->get_vecstore_for_source($source);
        if ($vecstore === null) {
            throw new \moodle_exception('error_novecstore', 'local_ai_content');
        }
        $embeddedchunks = [];
        $pendingchunks = $chunks;

        while (!empty($pendingchunks)) {
            $chunk = array_shift($pendingchunks);
            if (!is_string($chunk)) {
                continue;
            }
            $chunk = trim($chunk);
            if ($chunk === '') {
                continue;
            }

            $vectorrequest = $this->ai_manager->perform_request($chunk, 'local_ai_content', $this->context->id);
            if ($vectorrequest->get_code() !== 200) {
                if (self::should_retry_with_smaller_chunk($vectorrequest, $chunk)) {
                    [$leftchunk, $rightchunk] = self::split_chunk_in_half($chunk);
                    // Process the split chunks immediately to preserve source order in stored vectors.
                    array_unshift($pendingchunks, $rightchunk, $leftchunk);
                    continue;
                }

                $errormessage = trim((string)$vectorrequest->get_errormessage());
                if ($errormessage === '') {
                    $errormessage = 'Embedding request failed with code ' . $vectorrequest->get_code() . '.';
                }

                $exception = new \moodle_exception(
                    'indexingerror_embeddingrequestfailed',
                    'local_ai_content',
                    '',
                    $errormessage
                );
                // Assigned after construction on purpose: passing it to the constructor would inline the
                // debug info into the exception message, which is shown to source managers.
                $exception->debuginfo = trim((string)$vectorrequest->get_debuginfo());
                throw $exception;
            }

            $embeddedchunks[] = [
                'vector' => $vectorrequest->get_content(),
                'chunk' => $chunk,
            ];
        }

        $maxchunks = count($embeddedchunks);
        $vectorrecords = [];
        $chunkcount = 1;
        foreach ($embeddedchunks as $embeddedchunk) {
            $vectorrecords[] = new vector_record(
                $embeddedchunk['vector'],
                $embeddedchunk['chunk'],
                $sourceid,
                [rag_manager::PAYLOAD_CHUNK => $chunkcount, rag_manager::PAYLOAD_MAXCHUNKS => $maxchunks]
            );
            $chunkcount++;
        }

        $response = $vecstore->insert_embeddings($index->get_embeddingmodel(), $vectorrecords);
        if ($response->get_code() !== 200) {
            throw new \moodle_exception('error_storeembeddingsfailed', 'local_ai_content', '',
                $response->get_errormessage(), $response->get_debuginfo());
        }

        // Persist indexing metadata on the index record. The hash covers the extracted chunks (not the ones split for the
        // embedding requests), so it can be compared with the current content of the source to detect changes.
        $clock = \core\di::get(\core\clock::class);
        $index->set_contenthash(\core\di::get(source_content_reader::class)->hash_chunks($chunks));
        $index->set_lastindexed($clock->time());
        $index->store();
    }

    /**
     * Check whether an embedding failure should be retried with smaller chunks.
     *
     * @param \local_ai_manager\local\prompt_response $vectorrequest Failed prompt response.
     * @param string $chunk Submitted chunk.
     * @return bool
     */
    protected static function should_retry_with_smaller_chunk(\local_ai_manager\local\prompt_response $vectorrequest,
            string $chunk): bool {
        if ($vectorrequest->get_code() !== 400) {
            return false;
        }

        if (\core_text::strlen($chunk) <= self::MIN_RETRYABLE_CHUNK_LENGTH) {
            return false;
        }

        $errorcontext = \core_text::strtolower(trim((string)$vectorrequest->get_errormessage()) . ' ' .
            trim((string)$vectorrequest->get_debuginfo()));
        if ($errorcontext === '') {
            return false;
        }

        return str_contains($errorcontext, 'maximum context length')
            || str_contains($errorcontext, 'too many tokens')
            || str_contains($errorcontext, 'context_length_exceeded')
            || str_contains($errorcontext, 'max_tokens_per_request');
    }

    /**
     * Split a chunk into two non-empty chunks at a character midpoint.
     *
     * @param string $chunk Chunk to split.
     * @return string[]
     */
    protected static function split_chunk_in_half(string $chunk): array {
        $length = \core_text::strlen($chunk);
        $half = (int)max(1, floor($length / 2));
        $left = trim(\core_text::substr($chunk, 0, $half));
        $right = trim(\core_text::substr($chunk, $half));

        if ($left === '' || $right === '') {
            return [trim($chunk), ''];
        }

        return [$left, $right];
    }

    /**
     * Resolves the vector store driver of the vector store instance the source is bound to.
     *
     * @param source $source The source whose target vector store is resolved.
     * @return ?\local_ai_manager\base_vecstore The vector store driver, or null if the source is not bound to one.
     */
    protected function get_vecstore_for_source(source $source): ?\local_ai_manager\base_vecstore {
        $vecstoreid = $source->get_vecstoreid();
        if (!$vecstoreid) {
            return null;
        }
        // A deleted vector store instance unbinds its sources beforehand, so a bound instance always exists.
        return \core\di::get(\local_ai_manager\local\vecstore_factory::class)->get_vecstore_by_id($vecstoreid);
    }
}

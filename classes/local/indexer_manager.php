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

use aipurpose_embedding\purpose as embedding_purpose;
use local_ai_manager\local\vecstore_factory;
use local_ai_manager\local\vector_record;
use local_ai_manager\manager;

/**
 * Manages the indexing of Moodle content into the vector store.
 *
 * Supports module sources (extracted via content extractors) and document sources (indexed directly from their
 * stored plain-text content). External sources are never indexed here: their vectors already live in a vector
 * store instance and are only referenced.
 *
 * Obtain it via dependency injection.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class indexer_manager {
    /** @var int Smallest chunk length that may still be retried with a split. */
    protected const MIN_RETRYABLE_CHUNK_LENGTH = 200;

    /**
     * Constructor.
     *
     * @param source_content_reader $contentreader Reader of the indexable content of sources.
     * @param vecstore_factory $vecstorefactory Factory of the vector store drivers.
     * @param \core\clock $clock Clock for the indexing timestamp.
     */
    public function __construct(
        /** @var source_content_reader Reader of the indexable content of sources. */
        private readonly source_content_reader $contentreader,
        /** @var vecstore_factory Factory of the vector store drivers. */
        private readonly vecstore_factory $vecstorefactory,
        /** @var \core\clock Clock for the indexing timestamp. */
        private readonly \core\clock $clock,
    ) {
    }

    /**
     * Indexes one source with the embedding model of an index.
     *
     * The embedding requests are made with the given AI manager, which has to use the embedding model of the index. Every
     * case in which nothing could be indexed is an error, so a source is never reported as indexed without having vectors.
     *
     * @param source $source The source to index.
     * @param model_index $index The index of the source for the embedding model, updated with the indexing metadata.
     * @param manager $embeddingmanager AI manager of the embedding purpose for the embedding requests.
     * @throws \moodle_exception If the source cannot be indexed.
     */
    public function index_single_source(source $source, model_index $index, manager $embeddingmanager): void {
        if (!$source->get_enabled()) {
            return;
        }

        // Hashed before reading the content: if the content changes meanwhile, the stored hash is the older one and the
        // next change check marks the index outdated.
        $contenthash = $this->contentreader->get_content_hash($source);
        $this->index_source($source, $index, $this->contentreader->get_chunks($source), $contenthash, $embeddingmanager);
    }

    /**
     * Embeds the given content chunks of a source and stores them in the collection of the embedding model.
     *
     * Records the content hash and the indexing timestamp on the index record. The chunks are embedded in batches, one
     * embedding request per batch of the size configured in the admin setting embeddingbatchsize.
     *
     * @param source $source The source to index.
     * @param model_index $index The index of the source for the embedding model.
     * @param string[] $chunks The content chunks to embed and store, as returned by {@see source_content_reader::get_chunks()}.
     * @param string $contenthash The hash of the content, as returned by {@see source_content_reader::get_content_hash()}.
     * @param manager $embeddingmanager AI manager of the embedding purpose for the embedding requests.
     * @throws \moodle_exception If there is no content to index or an embedding request fails.
     */
    protected function index_source(
        source $source,
        model_index $index,
        array $chunks,
        string $contenthash,
        manager $embeddingmanager,
    ): void {
        $chunks = array_values(array_filter(array_map('trim', $chunks), fn(string $chunk): bool => $chunk !== ''));
        if (empty($chunks)) {
            throw new \moodle_exception('indexingerror_nocontent', 'local_ai_content');
        }

        $sourceid = $source->get_id();
        $vecstore = $this->get_vecstore_for_source($source);
        if ($vecstore === null) {
            throw new \moodle_exception('error_novecstore', 'local_ai_content');
        }
        // Config value, an invalid batch size must not break the indexing.
        $batchsize = max(1, (int) get_config('local_ai_content', 'embeddingbatchsize'));
        $embeddedchunks = [];
        $pendingbatches = array_chunk($chunks, $batchsize);

        while (!empty($pendingbatches)) {
            $batch = array_shift($pendingbatches);

            $vectorrequest = $embeddingmanager->perform_request(
                '',
                'local_ai_content',
                $source->get_contextid(),
                [embedding_purpose::OPTION_PROMPTTEXTS => $batch]
            );
            if ($vectorrequest->get_code() !== 200) {
                if (self::should_retry_with_smaller_batch($vectorrequest, $batch)) {
                    // Process the split batches immediately to preserve source order in stored vectors.
                    array_unshift($pendingbatches, ...self::split_batch_in_half($batch));
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

            // The connector returns one vector per chunk in the order of the chunks.
            foreach (json_decode($vectorrequest->get_content(), true) as $i => $vector) {
                $embeddedchunks[] = [
                    'vector' => json_encode($vector),
                    'chunk' => $batch[$i],
                ];
            }
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

        // Persist indexing metadata on the index record. The content hash is compared with the hash of the current content
        // of the source to detect changes.
        $index->set_contenthash($contenthash);
        $index->set_lastindexed($this->clock->time());
        $index->store();
    }

    /**
     * Check whether an embedding failure should be retried with a smaller batch.
     *
     * Only failures caused by too many tokens are retried. A batch of several chunks is retried with fewer chunks, a single
     * chunk with a shorter text as long as it is not too short already.
     *
     * @param \local_ai_manager\local\prompt_response $vectorrequest Failed prompt response.
     * @param string[] $batch Submitted chunks.
     * @return bool
     */
    protected static function should_retry_with_smaller_batch(\local_ai_manager\local\prompt_response $vectorrequest,
            array $batch): bool {
        if ($vectorrequest->get_code() !== 400) {
            return false;
        }

        if (count($batch) === 1 && \core_text::strlen($batch[0]) <= self::MIN_RETRYABLE_CHUNK_LENGTH) {
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
     * Split a batch into two smaller batches, keeping the order of the chunks.
     *
     * A batch of several chunks is split between the chunks, a single chunk is split into two chunks at a character midpoint.
     *
     * @param string[] $batch Batch to split, either several chunks or a single chunk longer than one character.
     * @return string[][] The two batches.
     */
    protected static function split_batch_in_half(array $batch): array {
        if (count($batch) > 1) {
            return array_chunk($batch, (int) ceil(count($batch) / 2));
        }

        $chunk = $batch[0];
        $half = intdiv(\core_text::strlen($chunk), 2);
        // The chunk is trimmed, so both halves contain text.
        return [[trim(\core_text::substr($chunk, 0, $half))], [trim(\core_text::substr($chunk, $half))]];
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
        return $this->vecstorefactory->get_vecstore_by_id($vecstoreid);
    }
}

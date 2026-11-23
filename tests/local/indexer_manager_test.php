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
use local_ai_manager\base_vecstore;
use local_ai_manager\local\prompt_response;
use local_ai_manager\local\usage;
use local_ai_manager\local\vecstore_factory;
use local_ai_manager\local\vecstore_response;
use local_ai_manager\local\vector_record;
use local_ai_manager\manager;

/**
 * Tests for indexer_manager.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(indexer_manager::class)]
final class indexer_manager_test extends \advanced_testcase {
    /** @var string Error message of an embedding endpoint rejecting a request with too many tokens. */
    private const TOKEN_LIMIT_ERROR = "This model's maximum context length is 8192 tokens";

    /** @var array[] The prompt texts of the embedding requests, one entry per request. */
    private array $requestprompttexts = [];

    /** @var vector_record[] The vector records stored in the vector store. */
    private array $storedrecords = [];

    /**
     * Test that the chunks are embedded in batches of the configured size and stored in their order.
     */
    public function test_index_single_source_embeds_chunks_in_batches(): void {
        $this->resetAfterTest();
        set_config('embeddingbatchsize', 2, 'local_ai_content');
        $chunks = ['first', ' second ', '   ', 'third', 'fourth', 'fifth'];
        $embeddingmanager = $this->create_embedding_manager(fn(array $prompttexts): ?prompt_response => null);

        $this->create_indexer($chunks)->index_single_source($this->create_source(), $this->create_index(), $embeddingmanager);

        // Whitespace only chunks are skipped, the other chunks are trimmed.
        $this->assertSame([['first', 'second'], ['third', 'fourth'], ['fifth']], $this->requestprompttexts);
        $this->assert_stored_chunks(['first', 'second', 'third', 'fourth', 'fifth']);
    }

    /**
     * Test that a batch exceeding the token limit is split into smaller batches, down to splitting a single chunk.
     */
    public function test_index_single_source_splits_batch_on_token_limit(): void {
        $this->resetAfterTest();
        set_config('embeddingbatchsize', 4, 'local_ai_content');
        $longchunk = str_repeat('a', 150) . str_repeat('b', 150);
        $chunks = ['first', $longchunk, 'third'];
        // Every batch with the long chunk exceeds the token limit.
        $embeddingmanager = $this->create_embedding_manager(
            fn(array $prompttexts): ?prompt_response => in_array($longchunk, $prompttexts, true)
                ? prompt_response::create_from_error(400, 'Bad request', self::TOKEN_LIMIT_ERROR)
                : null
        );

        $this->create_indexer($chunks)->index_single_source($this->create_source(), $this->create_index(), $embeddingmanager);

        $this->assertSame([
            ['first', $longchunk, 'third'],
            ['first', $longchunk],
            ['first'],
            [$longchunk],
            [str_repeat('a', 150)],
            [str_repeat('b', 150)],
            ['third'],
        ], $this->requestprompttexts);
        $this->assert_stored_chunks(['first', str_repeat('a', 150), str_repeat('b', 150), 'third']);
    }

    /**
     * Test that a failing embedding request which cannot be retried aborts the indexing without storing anything.
     */
    public function test_index_single_source_fails_on_embedding_error(): void {
        $this->resetAfterTest();
        $embeddingmanager = $this->create_embedding_manager(
            fn(array $prompttexts): ?prompt_response => prompt_response::create_from_error(500, 'Server error', '')
        );

        try {
            $this->create_indexer(['first', 'second'])
                ->index_single_source($this->create_source(), $this->create_index(false), $embeddingmanager);
            $this->fail('The indexing should have failed.');
        } catch (\moodle_exception $exception) {
            $this->assertSame('indexingerror_embeddingrequestfailed', $exception->errorcode);
        }
        $this->assertCount(1, $this->requestprompttexts);
        $this->assertEmpty($this->storedrecords);
    }

    /**
     * Creates the indexer with mocked content reader and vector store, which records the stored vectors.
     *
     * @param string[] $chunks The chunks the content reader returns.
     * @return indexer_manager The indexer.
     */
    private function create_indexer(array $chunks): indexer_manager {
        $contentreader = $this->createMock(source_content_reader::class);
        $contentreader->method('get_chunks')->willReturn($chunks);
        $contentreader->method('get_content_hash')->willReturn('contenthash');
        \core\di::set(source_content_reader::class, $contentreader);

        $vecstore = $this->createMock(base_vecstore::class);
        $vecstore->method('insert_embeddings')->willReturnCallback(
            function (string $model, array $records): vecstore_response {
                $this->storedrecords = $records;
                return vecstore_response::create_from_result();
            }
        );
        $vecstorefactory = $this->createMock(vecstore_factory::class);
        $vecstorefactory->method('get_vecstore_by_id')->willReturn($vecstore);
        \core\di::set(vecstore_factory::class, $vecstorefactory);

        return \core\di::get(indexer_manager::class);
    }

    /**
     * Creates a mocked embedding manager which records the prompt texts of the embedding requests.
     *
     * Successful requests return one vector per prompt text, see {@see self::get_vector()}.
     *
     * @param callable $error Returns the error response for the prompt texts of a request, or null if the request succeeds:
     *  function(array $prompttexts): ?prompt_response
     * @return manager The mocked embedding manager.
     */
    private function create_embedding_manager(callable $error): manager {
        $embeddingmanager = $this->createMock(manager::class);
        $embeddingmanager->method('perform_request')->willReturnCallback(
            function (string $prompttext, string $component, int $contextid, array $options) use ($error): prompt_response {
                $this->assertSame('', $prompttext);
                $prompttexts = $options[embedding_purpose::OPTION_PROMPTTEXTS];
                $this->requestprompttexts[] = $prompttexts;
                return $error($prompttexts) ?? prompt_response::create_from_result(
                    'model',
                    new usage(1.0, 1.0, 0.0),
                    json_encode(array_map(fn(string $text): array => $this->get_vector($text), $prompttexts))
                );
            }
        );
        return $embeddingmanager;
    }

    /**
     * Creates a mocked enabled source bound to a vector store.
     *
     * @return source The mocked source.
     */
    private function create_source(): source {
        $source = $this->createMock(source::class);
        $source->method('get_enabled')->willReturn(true);
        $source->method('get_id')->willReturn(7);
        $source->method('get_vecstoreid')->willReturn(3);
        $source->method('get_contextid')->willReturn(\core\context\system::instance()->id);
        return $source;
    }

    /**
     * Creates a mocked index of an embedding model.
     *
     * @param bool $expectstored Whether the indexing is expected to succeed and store the content hash.
     * @return model_index The mocked index.
     */
    private function create_index(bool $expectstored = true): model_index {
        $index = $this->createMock(model_index::class);
        $index->method('get_embeddingmodel')->willReturn('model');
        $index->expects($expectstored ? $this->once() : $this->never())->method('set_contenthash')->with('contenthash');
        $index->expects($expectstored ? $this->once() : $this->never())->method('store');
        return $index;
    }

    /**
     * Returns the vector the mocked embedding manager returns for a text, unique per text.
     *
     * @param string $text The embedded text.
     * @return float[] The vector.
     */
    private function get_vector(string $text): array {
        // Fractional values like real embeddings, JSON encodes floats without fraction as integers.
        return [crc32($text) / 4294967296, \core_text::strlen($text) + 0.5];
    }

    /**
     * Asserts that the given chunks have been stored in this order, each with its vector and position.
     *
     * @param string[] $expectedchunks The expected chunks.
     */
    private function assert_stored_chunks(array $expectedchunks): void {
        $this->assertCount(count($expectedchunks), $this->storedrecords);
        foreach ($expectedchunks as $i => $chunk) {
            $record = $this->storedrecords[$i];
            $this->assertSame($chunk, $record->get_content());
            $this->assertSame($this->get_vector($chunk), json_decode($record->get_vector(), true));
            $this->assertSame(7, $record->get_documentid());
            $this->assertSame(
                [rag_manager::PAYLOAD_CHUNK => $i + 1, rag_manager::PAYLOAD_MAXCHUNKS => count($expectedchunks)],
                $record->get_metadata()
            );
        }
    }
}








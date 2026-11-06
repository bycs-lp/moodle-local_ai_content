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
use local_ai_manager\base_vecstore;
use local_ai_manager\base_vecstore_instance;
use local_ai_manager\local\vecstore_factory;
use local_ai_manager\local\vecstore_response;

/**
 * Tests for the index_service, especially the handling of indexes of several embedding models.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(index_service::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(observer::class)]
final class index_service_test extends \advanced_testcase {
    /** @var int Id of the vector store instance the test sources are bound to. */
    private const VECSTOREID = 42;

    /**
     * Let the current user use the given embedding model.
     *
     * @param ?string $model The embedding model name, null if the user has no embedding model.
     */
    private function mock_current_model(?string $model): void {
        $resolver = $this->createMock(embedding_model_resolver::class);
        $resolver->method('get_current_model')->willReturn($model);
        \core\di::set(embedding_model_resolver::class, $resolver);
    }

    /**
     * Replace the vector store of the test sources by a mock.
     *
     * @return base_vecstore&\PHPUnit\Framework\MockObject\MockObject The mocked vector store.
     */
    private function mock_vecstore(): base_vecstore {
        $vecstore = $this->createMock(base_vecstore::class);
        $vecstorefactory = $this->createMock(vecstore_factory::class);
        $vecstorefactory->method('get_vecstore_by_id')->with(self::VECSTOREID)->willReturn($vecstore);
        \core\di::set(vecstore_factory::class, $vecstorefactory);
        return $vecstore;
    }

    /**
     * Create an indexed document source with indexes for the given embedding models.
     *
     * @param string[] $models The embedding models the source is indexed with.
     * @param ?int $vecstoreid The vector store instance the source is bound to.
     * @return source The source.
     */
    private function create_indexed_source(array $models, ?int $vecstoreid = self::VECSTOREID): source {
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $source = $generator->create_source([
            'contextid' => \context_system::instance()->id,
            'content' => 'Sample content',
            'allowindex' => !empty($models),
            'vecstoreid' => $vecstoreid,
        ]);
        foreach ($models as $model) {
            $generator->create_model_index(['sourceid' => $source->get_id(), 'embeddingmodel' => $model]);
        }
        return $source;
    }

    /**
     * Starting indexing adds a queued index for the model of the current user and keeps the indexes of other models.
     */
    public function test_start_adds_index_for_current_model(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $this->mock_current_model('model-b');
        $source = $this->create_indexed_source(['model-a']);

        $state = \core\di::get(index_service::class)->start($source)->to_array();

        $indexes = model_index::get_for_sources([$source->get_id()])[$source->get_id()];
        $this->assertSame(['model-a', 'model-b'], array_keys($indexes));
        $this->assertSame(model_index::STATUS_INDEXED, $indexes['model-a']->get_status());
        $this->assertSame(model_index::STATUS_QUEUED, $indexes['model-b']->get_status());
        $this->assertNotNull($indexes['model-b']->get_taskid());
        $this->assertSame(model_index::STATUS_QUEUED, $state['status']);
        $this->assertFalse($state['canIndexCurrentModel']);
        $this->assertTrue(source::get_record(['id' => $source->get_id()])->get_allowindex());
    }

    /**
     * A source not bound to a vector store yet is bound to the primary vector store when indexing starts.
     */
    public function test_start_binds_primary_vecstore(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $this->mock_current_model('model-a');
        $instance = $this->createMock(base_vecstore_instance::class);
        $instance->method('get_id')->willReturn(self::VECSTOREID);
        $vecstorefactory = $this->createMock(vecstore_factory::class);
        $vecstorefactory->method('get_primary_instance')->willReturn($instance);
        \core\di::set(vecstore_factory::class, $vecstorefactory);
        $source = $this->create_indexed_source([], null);

        \core\di::get(index_service::class)->start($source);

        $this->assertSame(self::VECSTOREID, source::get_record(['id' => $source->get_id()])->get_vecstoreid());
    }

    /**
     * A user without embedding model cannot start indexing.
     */
    public function test_start_requires_embedding_model(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $this->mock_current_model(null);
        $source = $this->create_indexed_source([]);

        $this->expectException(\moodle_exception::class);
        $this->expectExceptionMessage(get_string('error_noembeddingmodel', 'local_ai_content'));
        \core\di::get(index_service::class)->start($source);
    }

    /**
     * Stopping indexing deletes the vectors and indexes of all embedding models and unbinds the source.
     */
    public function test_stop_deletes_all_indexes(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $this->mock_current_model('model-a');
        $source = $this->create_indexed_source(['model-a', 'model-b']);
        $vecstore = $this->mock_vecstore();
        $vecstore->expects($this->once())->method('delete_embeddings')->with(null, $source->get_id())
            ->willReturn(vecstore_response::create_from_result());

        \core\di::get(index_service::class)->stop($source);

        $this->assertSame([], model_index::get_for_sources([$source->get_id()]));
        $reloaded = source::get_record(['id' => $source->get_id()]);
        $this->assertNull($reloaded->get_vecstoreid());
        $this->assertFalse($reloaded->get_allowindex());
    }

    /**
     * A changed source is re-indexed with the model of the current user, the outdated indexes of other models are deleted.
     */
    public function test_reindex_changed_source_deletes_other_models(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $this->mock_current_model('model-b');
        $source = $this->create_indexed_source(['model-a', 'model-b']);
        $vecstore = $this->mock_vecstore();
        $vecstore->expects($this->once())->method('delete_embeddings')->with('model-a', $source->get_id())
            ->willReturn(vecstore_response::create_from_result());

        \core\di::get(index_service::class)->reindex_changed_source($source);

        $indexes = model_index::get_for_sources([$source->get_id()])[$source->get_id()];
        $this->assertSame(['model-b'], array_keys($indexes));
        $this->assertSame(model_index::STATUS_QUEUED, $indexes['model-b']->get_status());
    }

    /**
     * Only a user whose embedding model has no usable index yet is offered to index the source with their model.
     */
    public function test_get_state_offers_indexing_with_current_model(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $source = $this->create_indexed_source(['model-a']);

        $this->mock_current_model('model-a');
        $this->assertFalse(\core\di::get(index_service::class)->get_state($source)->to_array()['canIndexCurrentModel']);

        // The container caches the service, so a fresh one is needed to pick up the other model.
        $this->mock_current_model('model-b');
        $state = \core\di::get_container()->make(index_service::class)->get_state($source)->to_array();
        $this->assertTrue($state['canIndexCurrentModel']);
        $this->assertSame('model-b', $state['currentModel']);
        $this->assertSame('model-a', $state['models'][0]['model']);
    }

    /**
     * Only completed indexes whose indexed content differs from the current content are marked as outdated.
     */
    public function test_check_source_changes_marks_changed_indexes_outdated(): void {
        $this->resetAfterTest();
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $reader = \core\di::get(source_content_reader::class);
        $source = $generator->create_source([
            'contextid' => \context_system::instance()->id,
            'content' => 'Current content',
            'allowindex' => true,
            'vecstoreid' => self::VECSTOREID,
        ]);
        $currenthash = $reader->hash_chunks($reader->get_chunks($source));
        $oldhash = $reader->hash_chunks(['Old content']);
        $indexes = [
            'unchanged' => ['status' => model_index::STATUS_INDEXED, 'contenthash' => $currenthash],
            'changed' => ['status' => model_index::STATUS_INDEXED, 'contenthash' => $oldhash],
            'failed' => ['status' => model_index::STATUS_FAILED, 'contenthash' => $oldhash],
        ];
        foreach ($indexes as $model => $record) {
            $generator->create_model_index(['sourceid' => $source->get_id(), 'embeddingmodel' => $model] + $record);
        }

        \core\di::get(index_service::class)->check_source_changes($source->get_id());

        $indexes = model_index::get_for_sources([$source->get_id()])[$source->get_id()];
        $this->assertSame(model_index::STATUS_INDEXED, $indexes['unchanged']->get_status());
        $this->assertSame(model_index::STATUS_OUTDATED, $indexes['changed']->get_status());
        $this->assertSame(model_index::STATUS_FAILED, $indexes['failed']->get_status());
        $this->assertTrue($indexes['changed']->is_searchable());
    }

    /**
     * Updating a course module with an indexed source queues the change check, which marks the index as outdated if the
     * extracted content has changed.
     */
    public function test_course_module_update_marks_changed_module_source_outdated(): void {
        global $DB;

        $this->resetAfterTest();
        $this->setAdminUser();
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $course = $this->getDataGenerator()->create_course();
        $page = $this->getDataGenerator()->create_module('page', ['course' => $course->id, 'content' => 'Original content']);
        $cm = get_fast_modinfo($course)->get_cm($page->cmid);
        $source = $generator->create_source([
            'contextid' => $cm->context->id,
            'sourcetype' => source::TYPE_MODULE,
            'cmid' => $cm->id,
            'allowindex' => true,
            'vecstoreid' => self::VECSTOREID,
        ]);
        $reader = \core\di::get(source_content_reader::class);
        $index = $generator->create_model_index([
            'sourceid' => $source->get_id(),
            'contenthash' => $reader->hash_chunks($reader->get_chunks($source)),
        ]);

        // An update without content change keeps the index.
        \core\event\course_module_updated::create_from_cm($cm)->trigger();
        $this->runAdhocTasks(\local_ai_content\task\check_source_changes_adhoc::class);
        $this->assertSame(model_index::STATUS_INDEXED, (new model_index($index->get_id()))->get_status());

        $DB->set_field('page', 'content', 'Changed content', ['id' => $page->id]);
        rebuild_course_cache($course->id, true);
        \core\event\course_module_updated::create_from_cm($cm)->trigger();
        $this->runAdhocTasks(\local_ai_content\task\check_source_changes_adhoc::class);
        $this->assertSame(model_index::STATUS_OUTDATED, (new model_index($index->get_id()))->get_status());

        // An outdated index is not checked again.
        \core\event\course_module_updated::create_from_cm($cm)->trigger();
        $this->assertSame(0, $DB->count_records('task_adhoc',
            ['classname' => '\\' . \local_ai_content\task\check_source_changes_adhoc::class]));
    }
}

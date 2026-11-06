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

namespace local_ai_content;

use local_ai_content\local\model_index;
use local_ai_content\task\index_source_adhoc;

/**
 * Tests for index_source_adhoc task safeguards.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(index_source_adhoc::class)]
final class index_source_adhoc_test extends \advanced_testcase {
    /** @var string Embedding model of the index under test. */
    private const MODEL = 'embedding-model';

    /**
     * Create a document source with a queued index.
     *
     * @return model_index The index of the source.
     */
    private function create_index(): model_index {
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $source = $generator->create_source([
            'contextid' => \context_system::instance()->id,
            'content' => 'Sample content',
            'allowindex' => true,
        ]);
        return $generator->create_model_index([
            'sourceid' => $source->get_id(),
            'embeddingmodel' => self::MODEL,
            'status' => model_index::STATUS_QUEUED,
        ]);
    }

    /**
     * Queue an indexing task for a source.
     *
     * @param int $sourceid The source id in the custom data.
     * @return index_source_adhoc The queued task carrying its id.
     */
    private function queue_task(int $sourceid): index_source_adhoc {
        $task = new index_source_adhoc();
        $task->set_custom_data(['sourceid' => $sourceid, 'embeddingmodel' => self::MODEL]);
        $task->set_id(\core\task\manager::queue_adhoc_task($task));
        return $task;
    }

    /**
     * Queue an indexing task for the source of an index and make it the active task of the index.
     *
     * @param model_index $index The index.
     * @return index_source_adhoc The queued task.
     */
    private function queue_active_task(model_index $index): index_source_adhoc {
        $task = $this->queue_task($index->get_sourceid());
        $index->set_taskid($task->get_id());
        $index->store();
        return $task;
    }

    /**
     * Run one indexing task without emitting progress output.
     *
     * @param index_source_adhoc $task The task.
     */
    private function execute_task(index_source_adhoc $task): void {
        ob_start();
        $task->execute();
        ob_end_clean();
    }

    /**
     * Run one indexing task that is expected to fail and rethrow its error for the task log.
     *
     * @param index_source_adhoc $task The task.
     */
    private function execute_failing_task(index_source_adhoc $task): void {
        ob_start();
        try {
            $task->execute();
            $this->fail('The indexing task must rethrow its error.');
        } catch (\moodle_exception $e) {
            $this->assertSame('indexingerror_modelchanged', $e->errorcode);
        } finally {
            ob_end_clean();
        }
    }

    /**
     * A task that is no longer the active task of its index must not change any state.
     */
    public function test_execute_skips_superseded_task(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $index = $this->create_index();
        $supersededtask = $this->queue_task($index->get_sourceid());
        $activetask = $this->queue_active_task($index);
        $this->execute_task($supersededtask);

        $reloaded = model_index::get($index->get_sourceid(), self::MODEL);

        $this->assertSame(model_index::STATUS_QUEUED, $reloaded->get_status());
        $this->assertSame($activetask->get_id(), $reloaded->get_taskid());
    }

    /**
     * A task for a deleted source must not raise an error.
     */
    public function test_execute_skips_deleted_source(): void {
        global $DB;
        $this->resetAfterTest();
        $this->setAdminUser();

        $index = $this->create_index();
        $task = $this->queue_active_task($index);
        $DB->delete_records('local_ai_content_sources', ['id' => $index->get_sourceid()]);

        $this->execute_task($task);

        $this->assertDebuggingNotCalled();
    }

    /**
     * A failing indexing run must report the failed status and keep indexing switched on.
     */
    public function test_execute_marks_index_failed_on_error(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        // No embedding tool is configured in tests, so the embedding model of the index is not available.
        $index = $this->create_index();
        $this->execute_failing_task($this->queue_active_task($index));

        $reloaded = model_index::get($index->get_sourceid(), self::MODEL);

        $this->assertSame(model_index::STATUS_FAILED, $reloaded->get_status());
        $this->assertSame(get_string('indexingerror_modelchanged', 'local_ai_content', self::MODEL), $reloaded->get_error());
        $this->assertTrue(source::get_record(['id' => $index->get_sourceid()])->get_allowindex());
    }

    /**
     * With developer debugging the technical details must be stored alongside the message.
     */
    public function test_execute_stores_debug_info_when_debugging(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        set_debugging(DEBUG_DEVELOPER);

        $index = $this->create_index();
        $this->execute_failing_task($this->queue_active_task($index));

        $reloaded = model_index::get($index->get_sourceid(), self::MODEL);

        $this->assertNotEmpty($reloaded->get_error());
        $this->assertNotEmpty($reloaded->get_debuginfo());
    }

    /**
     * Without debugging no technical details must leave the server.
     */
    public function test_execute_hides_debug_info_without_debugging(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        set_debugging(DEBUG_NONE);

        $index = $this->create_index();
        $this->execute_failing_task($this->queue_active_task($index));

        $reloaded = model_index::get($index->get_sourceid(), self::MODEL);

        $this->assertNotEmpty($reloaded->get_error());
        $this->assertNull($reloaded->get_debuginfo());
    }

    /**
     * The message shown to source managers must never contain the technical details.
     */
    public function test_execute_keeps_message_free_of_debug_info(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        set_debugging(DEBUG_DEVELOPER);

        $index = $this->create_index();
        $this->execute_failing_task($this->queue_active_task($index));

        $reloaded = model_index::get($index->get_sourceid(), self::MODEL);

        $this->assertStringNotContainsString('#0 ', (string) $reloaded->get_error());
        $this->assertStringContainsString('#0 ', (string) $reloaded->get_debuginfo());
    }
}


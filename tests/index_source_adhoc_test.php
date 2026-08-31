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

/**
 * Tests for index_source_adhoc task safeguards.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(\local_ai_content\task\index_source_adhoc::class)]
final class index_source_adhoc_test extends \advanced_testcase {
    /**
     * Create a document source bound to one indexing task.
     *
     * @param ?int $indextaskid Task id the source is bound to.
     * @return source
     */
    private function create_source(?int $indextaskid): source {
        $source = new source();
        $source->set_contextid(\context_system::instance()->id);
        $source->set_sourcetype(source::TYPE_DOCUMENT);
        $source->set_name('Test source');
        $source->set_content('Sample content');
        $source->set_enabled(true);
        $source->set_allowindex(true);
        $source->set_indexstatus(source::INDEXSTATUS_QUEUED);
        $source->set_indextaskid($indextaskid);
        $source->store();

        return $source;
    }

    /**
     * Run one indexing task without emitting progress output.
     *
     * @param int $taskid The task id.
     * @param int $sourceid The source id in the custom data.
     */
    private function execute_task(int $taskid, int $sourceid): void {
        $task = new \local_ai_content\task\index_source_adhoc();
        $task->set_id($taskid);
        $task->set_custom_data(['sourceid' => $sourceid]);
        ob_start();
        $task->execute();
        ob_end_clean();
    }

    /**
     * A task that is no longer the active task of its source must not change any state.
     */
    public function test_execute_skips_superseded_task(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $source = $this->create_source(9999);
        $this->execute_task(1234, $source->get_id());

        $reloaded = source::get_record(['id' => $source->get_id()]);

        $this->assertSame(source::INDEXSTATUS_QUEUED, $reloaded->get_indexstatus());
        $this->assertSame(9999, $reloaded->get_indextaskid());
        $this->assertTrue($reloaded->get_allowindex());
    }

    /**
     * A task for a deleted source must not raise an error.
     */
    public function test_execute_skips_deleted_source(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $this->execute_task(1234, 999999);

        $this->assertDebuggingNotCalled();
    }

    /**
     * A failing indexing run must switch indexing off and report the failed status.
     */
    public function test_execute_marks_source_failed_on_error(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        // No embedding connector is configured in tests, so indexing is guaranteed to fail.
        $source = $this->create_source(4242);
        $this->execute_task(4242, $source->get_id());

        $reloaded = source::get_record(['id' => $source->get_id()]);

        $this->assertSame(source::INDEXSTATUS_FAILED, $reloaded->get_indexstatus());
        $this->assertFalse($reloaded->get_allowindex());
        $this->assertNotEmpty($reloaded->get_indexerror());
    }

    /**
     * With developer debugging the technical details must be stored alongside the message.
     */
    public function test_execute_stores_debug_info_when_debugging(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        set_debugging(DEBUG_DEVELOPER);

        $source = $this->create_source(4243);
        $this->execute_task(4243, $source->get_id());

        $reloaded = source::get_record(['id' => $source->get_id()]);

        $this->assertNotEmpty($reloaded->get_indexerror());
        $this->assertNotEmpty($reloaded->get_indexdebuginfo());
    }

    /**
     * Without debugging no technical details must leave the server.
     */
    public function test_execute_hides_debug_info_without_debugging(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        set_debugging(DEBUG_NONE);

        $source = $this->create_source(4244);
        $this->execute_task(4244, $source->get_id());

        $reloaded = source::get_record(['id' => $source->get_id()]);

        $this->assertNotEmpty($reloaded->get_indexerror());
        $this->assertNull($reloaded->get_indexdebuginfo());
    }

    /**
     * The message shown to source managers must never contain the technical details.
     */
    public function test_execute_keeps_message_free_of_debug_info(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        set_debugging(DEBUG_DEVELOPER);

        $source = $this->create_source(4245);
        $this->execute_task(4245, $source->get_id());

        $reloaded = source::get_record(['id' => $source->get_id()]);

        $this->assertStringNotContainsString('#0 ', (string) $reloaded->get_indexerror());
        $this->assertStringContainsString('#0 ', (string) $reloaded->get_indexdebuginfo());
    }
}




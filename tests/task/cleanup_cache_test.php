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

namespace local_ai_content\task;

/**
 * Tests for the cleanup_cache scheduled task.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_ai_content\task\cleanup_cache
 */
final class cleanup_cache_test extends \advanced_testcase {
    /**
     * Test that expired entries are deleted.
     */
    public function test_deletes_expired_entries(): void {
        global $DB;
        $this->resetAfterTest();

        $now = \core\di::get(\core\clock::class)->time();

        // Default TTL is 90 days.
        set_config('cachettl', '90', 'local_ai_content');

        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');

        // Expired: last accessed 100 days ago.
        $generator->create_cache_record(['contenthash' => sha1('old1'), 'timelastaccessed' => $now - (100 * DAYSECS)]);
        $generator->create_cache_record(['contenthash' => sha1('old2'), 'timelastaccessed' => $now - (91 * DAYSECS)]);

        // Not expired: last accessed 50 days ago.
        $generator->create_cache_record(['contenthash' => sha1('fresh'), 'timelastaccessed' => $now - (50 * DAYSECS)]);

        $this->assertEquals(3, $DB->count_records('local_ai_content_cache'));

        $task = new cleanup_cache();

        ob_start();
        $task->execute();
        ob_end_clean();

        $this->assertEquals(1, $DB->count_records('local_ai_content_cache'));
        $this->assertTrue($DB->record_exists('local_ai_content_cache', ['contenthash' => sha1('fresh')]));
        $this->assertFalse($DB->record_exists('local_ai_content_cache', ['contenthash' => sha1('old1')]));
        $this->assertFalse($DB->record_exists('local_ai_content_cache', ['contenthash' => sha1('old2')]));
    }

    /**
     * Test that custom TTL setting is respected.
     */
    public function test_custom_ttl(): void {
        global $DB;
        $this->resetAfterTest();

        $now = \core\di::get(\core\clock::class)->time();

        // Set TTL to 30 days.
        set_config('cachettl', '30', 'local_ai_content');

        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');

        // 31 days old → expired with 30-day TTL.
        $generator->create_cache_record(['contenthash' => sha1('expired'), 'timelastaccessed' => $now - (31 * DAYSECS)]);

        // 29 days old → still fresh.
        $generator->create_cache_record(['contenthash' => sha1('fresh'), 'timelastaccessed' => $now - (29 * DAYSECS)]);

        $task = new cleanup_cache();

        ob_start();
        $task->execute();
        ob_end_clean();

        $this->assertEquals(1, $DB->count_records('local_ai_content_cache'));
        $this->assertTrue($DB->record_exists('local_ai_content_cache', ['contenthash' => sha1('fresh')]));
    }
}

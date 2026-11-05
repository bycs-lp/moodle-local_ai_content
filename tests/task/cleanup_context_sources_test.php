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

use local_ai_content\context_source;

/**
 * Tests for the cleanup_context_sources scheduled task.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(cleanup_context_sources::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(context_source::class)]
final class cleanup_context_sources_test extends \advanced_testcase {
    /**
     * The selections of all contexts of a deleted course are removed, the ones of other contexts are kept.
     */
    public function test_execute_removes_selections_of_deleted_course(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $sourceid = $generator->create_source(['contextid' => \context_system::instance()->id])->get_id();

        $course = $this->getDataGenerator()->create_course();
        $coursecontextid = \context_course::instance($course->id)->id;
        $page = $this->getDataGenerator()->create_module('page', ['course' => $course->id]);
        $qbank = $this->getDataGenerator()->create_module('qbank', ['course' => $course->id]);
        $block = $this->getDataGenerator()->create_block('ai_chat', ['parentcontextid' => $coursecontextid]);
        $deletedcontextids = [
            \context_module::instance($page->cmid)->id,
            \context_module::instance($qbank->cmid)->id,
            \context_block::instance($block->id)->id,
        ];

        $othercourse = $this->getDataGenerator()->create_course();
        $otherblock = $this->getDataGenerator()->create_block('ai_chat',
            ['parentcontextid' => \context_course::instance($othercourse->id)->id]);
        $keptcontextid = \context_block::instance($otherblock->id)->id;

        foreach ([...$deletedcontextids, $keptcontextid] as $contextid) {
            context_source::set_sourceids_for_context($contextid, [$sourceid]);
        }

        delete_course($course, false);

        $this->expectOutputRegex('/Deleted 3 source selections/');
        (new cleanup_context_sources())->execute();

        foreach ($deletedcontextids as $contextid) {
            $this->assertSame([], context_source::get_sourceids_for_context($contextid));
        }
        $this->assertSame([$sourceid], context_source::get_sourceids_for_context($keptcontextid));
    }
}


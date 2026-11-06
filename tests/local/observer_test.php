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
use local_ai_content\task\check_source_changes_adhoc;

/**
 * Tests for the event observers of local_ai_content.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(observer::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(\local_ai_content\cm_content_extractor::class)]
final class observer_test extends \advanced_testcase {
    /**
     * The content change events of all extractors are registered once each.
     */
    public function test_get_content_change_observers(): void {
        $observers = observer::get_content_change_observers();

        $eventnames = array_column($observers, 'eventname');
        $this->assertSame(array_unique($eventnames), $eventnames);
        foreach ([
            \core\event\course_module_updated::class,
            \mod_book\event\chapter_updated::class,
            \mod_lesson\event\page_moved::class,
            \mod_folder\event\folder_updated::class,
        ] as $eventclass) {
            $this->assertContains('\\' . $eventclass, $eventnames);
        }
        $this->assertSame(['\\' . observer::class . '::module_content_changed'],
            array_values(array_unique(array_column($observers, 'callback'))));
    }

    /**
     * Updating a book chapter queues the content change check of the indexed source of the book.
     */
    public function test_book_chapter_update_queues_change_check(): void {
        global $DB;

        $this->resetAfterTest();
        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        $book = $this->getDataGenerator()->create_module('book', ['course' => $course->id]);
        /** @var \mod_book_generator $bookgenerator */
        $bookgenerator = $this->getDataGenerator()->get_plugin_generator('mod_book');
        $chapter = $bookgenerator->create_chapter(['bookid' => $book->id, 'content' => 'Chapter content']);
        $context = \context_module::instance($book->cmid);
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $source = $generator->create_source([
            'contextid' => $context->id,
            'sourcetype' => source::TYPE_MODULE,
            'cmid' => $book->cmid,
            'allowindex' => true,
        ]);
        $generator->create_model_index(['sourceid' => $source->get_id()]);

        \mod_book\event\chapter_updated::create_from_chapter($book, $context, $chapter)->trigger();

        $tasks = $DB->get_records('task_adhoc', ['classname' => '\\' . check_source_changes_adhoc::class]);
        $this->assertCount(1, $tasks);
        $this->assertSame($source->get_id(), (int) json_decode(reset($tasks)->customdata)->sourceid);
    }
}


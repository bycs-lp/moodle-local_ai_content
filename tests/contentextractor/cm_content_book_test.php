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

namespace local_ai_content\contentextractor;

/**
 * Tests for cm_content_book.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(cm_content_book::class)]
final class cm_content_book_test extends \advanced_testcase {
    /**
     * Test that the description and visible chapters are extracted, hidden chapters and their subchapters are skipped.
     */
    public function test_extract_skips_hidden_chapters(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $book = $this->getDataGenerator()->create_module('book', [
            'course' => $course->id,
            'intro' => '<p>Book description</p>',
            'introformat' => FORMAT_HTML,
        ]);
        /** @var \mod_book_generator $bookgenerator */
        $bookgenerator = $this->getDataGenerator()->get_plugin_generator('mod_book');
        $bookgenerator->create_chapter(['bookid' => $book->id, 'pagenum' => 1, 'title' => 'Visible title',
            'content' => '<p>Visible chapter</p>']);
        $bookgenerator->create_chapter(['bookid' => $book->id, 'pagenum' => 2, 'title' => 'Hidden title',
            'content' => '<p>Hidden chapter</p>', 'hidden' => 1]);
        $bookgenerator->create_chapter(['bookid' => $book->id, 'pagenum' => 3, 'subchapter' => 1,
            'title' => 'Sub title', 'content' => '<p>Subchapter of hidden chapter</p>']);
        $cm = get_fast_modinfo($course)->get_cm($book->cmid);

        $content = (new cm_content_book())->extract($cm);

        $this->assertStringContainsString('Book description', $content);
        $this->assertStringContainsString('Visible title', $content);
        $this->assertStringContainsString('Visible chapter', $content);
        $this->assertStringNotContainsString('Hidden', $content);
        $this->assertStringNotContainsString('Subchapter of hidden chapter', $content);
    }
}


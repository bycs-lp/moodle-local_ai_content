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
 * Tests for cm_content_page.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(cm_content_page::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(\local_ai_content\cm_content_extractor::class)]
final class cm_content_page_test extends \advanced_testcase {
    /**
     * Test that the description and the content are extracted in their stored format.
     */
    public function test_extract_includes_intro_and_converts_format(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $page = $this->getDataGenerator()->create_module('page', [
            'course' => $course->id,
            'intro' => '<p>Page description</p>',
            'introformat' => FORMAT_HTML,
            'content' => "# Heading\n\nSome **markdown** text",
            'contentformat' => FORMAT_MARKDOWN,
        ]);
        $cm = get_fast_modinfo($course)->get_cm($page->cmid);

        $content = (new cm_content_page())->extract($cm);

        $this->assertStringContainsString('Page description', $content);
        // The markdown is converted to HTML first, html_to_text() renders bold text in upper case.
        $this->assertStringContainsString('Some MARKDOWN text', $content);
        $this->assertStringNotContainsString('**', $content);
        $this->assertLessThan(strpos($content, 'Some MARKDOWN text'), strpos($content, 'Page description'));
    }

    /**
     * Test that an empty description is skipped.
     */
    public function test_extract_without_intro(): void {
        global $DB;
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $page = $this->getDataGenerator()->create_module('page', [
            'course' => $course->id,
            'content' => '<p>Only content</p>',
            'contentformat' => FORMAT_HTML,
        ]);
        // The generator replaces an empty intro with a default text.
        $DB->set_field('page', 'intro', '', ['id' => $page->id]);
        $cm = get_fast_modinfo($course)->get_cm($page->cmid);

        $this->assertSame("Only content\n", (new cm_content_page())->extract($cm));
    }
}



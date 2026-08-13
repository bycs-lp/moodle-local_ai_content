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

use local_ai_content\cm_content_extractor;

/**
 * Class cm_content_book
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class cm_content_book extends cm_content_extractor {
    #[\Override]
    public function is_cm_supported(\core_course\cm_info $cm): bool {
        return $cm->modname === 'book';
    }

    #[\Override]
    public function extract(\core_course\cm_info $cm): string {
        global $CFG, $DB;
        require_once($CFG->dirroot . '/mod/book/locallib.php');

        $instance = $cm->get_instance_record();
        $book = $DB->get_record('book', ['id' => $instance->id]);
        if (!$book) {
            return '';
        }

        $chapters = book_preload_chapters($book);
        $chaptercontents = [];
        foreach ($chapters as $chapter) {
            $chaptercontents[] = $chapter->title . '<br/>' . $chapter->content;
        }

        $content = implode('<br/><br/>', $chaptercontents);
        return $this->format_extracted_cm_content($content);
    }
}






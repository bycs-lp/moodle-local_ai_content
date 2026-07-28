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

/**
 * Plugin callbacks for local_ai_content.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Delete extracted cache content when the last file with a content hash is deleted.
 *
 * @param stdClass $file The deleted file record from the files table.
 */
function local_ai_content_after_file_deleted(stdClass $file): void {
    global $DB;

    if ($DB->record_exists('files', ['contenthash' => $file->contenthash])) {
        return;
    }

    $DB->delete_records('local_ai_content_cache', ['contenthash' => $file->contenthash]);
}

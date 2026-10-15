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

/**
 * Add the manage sources link to the course secondary navigation.
 *
 * @param navigation_node $navigation The course navigation node to extend.
 * @param stdClass $course The course object.
 * @param context_course $context The course context object.
 */
function local_ai_content_extend_navigation_course(
    navigation_node $navigation,
    stdClass $course,
    context_course $context
) {
    global $PAGE;

    // Only show this link on real course pages.
    if (!$PAGE->course || (int) $PAGE->course->id === SITEID) {
        return;
    }

    if (!has_capability('local/ai_content:managesources', $context)) {
        return;
    }

    $url = new moodle_url('/local/ai_content/manage_sources.php', ['courseid' => (int) $course->id]);
    $linktext = get_string('managesourcespage', 'local_ai_content');

    $node = navigation_node::create(
        $linktext,
        $url,
        navigation_node::NODETYPE_LEAF,
        'local_ai_content_manage_sources',
        'local_ai_content_manage_sources',
    );

    if ($PAGE->url->compare($url, URL_MATCH_BASE)) {
        $node->make_active();
    }

    $navigation->add_node($node);
}


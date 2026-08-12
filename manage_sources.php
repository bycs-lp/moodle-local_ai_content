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
 * Course source management page.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../../config.php');

global $OUTPUT, $PAGE;

$courseid = required_param('courseid', PARAM_INT);
require_course_login($courseid);

$course = get_course($courseid);
$context = context_course::instance($courseid);
require_capability('local/ai_content:managesources', $context);

$url = new moodle_url('/local/ai_content/manage_sources.php', ['courseid' => $courseid]);
$PAGE->set_url($url);
$PAGE->set_context($context);
$PAGE->set_title(get_string('managesourcespage', 'local_ai_content'));
$PAGE->set_heading(format_string($course->fullname, true, ['context' => $context]));

echo $OUTPUT->header();

echo $OUTPUT->render_from_template('local_ai_content/source_manager', [
    'contextid' => $context->id,
]);

echo $OUTPUT->footer();




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
 * Page for testing text extraction from uploaded files.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../../config.php');

require_login();

$context = context_system::instance();
\local_ai_content\document_extractor::require_can_test_extraction($context);

$PAGE->set_url(new moodle_url('/local/ai_content/test_document_extraction.php'));
$PAGE->set_context($context);
$PAGE->set_title(get_string('test_extraction', 'local_ai_content'));
$PAGE->set_heading(get_string('test_extraction', 'local_ai_content'));

$errormessage = '';
$result = '';
$fileinfo = null;

$form = new \local_ai_content\form\test_extraction_form();

if ($form->is_cancelled()) {
    redirect(new moodle_url('/admin/settings.php', ['section' => 'local_ai_content']));
} else if ($data = $form->get_data()) {
    // Get the uploaded file from the draft area.
    $fs = get_file_storage();
    $usercontext = context_user::instance($USER->id);
    $draftitemid = file_get_submitted_draft_itemid('testfile');
    $files = $fs->get_area_files($usercontext->id, 'user', 'draft', $draftitemid, 'id', false);

    if (empty($files)) {
        $errormessage = get_string('test_extraction_nofile', 'local_ai_content');
    } else {
        $file = reset($files);
        $extractor = new \local_ai_content\document_extractor();

        // Collect file metadata.
        $fileinfo = new stdClass();
        $fileinfo->filename = $file->get_filename();
        $fileinfo->mimetype = $file->get_mimetype();
        $fileinfo->filesize = display_size($file->get_filesize());
        $fileinfo->contenthash = $file->get_contenthash();
        $fileinfo->supported = $extractor->is_file_supported($file);
        $fileinfo->supportedextensions = $extractor->get_supported_extensions();

        if (!$fileinfo->supported) {
            $errormessage = get_string('error_unsupportedfiletype', 'local_ai_content', $file->get_mimetype());
        } else {
            // Measure extraction time.
            $timestart = microtime(true);
            try {
                ob_start();
                $result = $extractor->extract_text_from_file($file, $context->id, $USER->id, 'local_ai_content');
            } catch (\Exception $e) {
                $errormessage = $e->getMessage();
            } finally {
                $mtrace = ob_get_clean();
                $fileinfo->duration = round(microtime(true) - $timestart, 3);
                $fileinfo->mtrace = $mtrace;
            }
        }
    }
}

echo $OUTPUT->header();

// Show file info and result if available.
if ($fileinfo) {
    // File metadata table.
    $table = new html_table();
    $table->attributes['class'] = 'generaltable';
    $table->head = [
        get_string('test_extraction_property', 'local_ai_content'),
        get_string('test_extraction_value', 'local_ai_content'),
    ];
    $table->data = [
        [get_string('filename', 'local_ai_content'), s($fileinfo->filename)],
        [get_string('test_extraction_mimetype', 'local_ai_content'), s($fileinfo->mimetype)],
        [get_string('test_extraction_filesize', 'local_ai_content'), $fileinfo->filesize],
        [get_string('test_extraction_contenthash', 'local_ai_content'), s($fileinfo->contenthash)],
        [
            get_string('test_extraction_supported', 'local_ai_content'),
            $fileinfo->supported ? get_string('yes') : get_string('no'),
        ],
        [
            get_string('test_extraction_supportedext', 'local_ai_content'),
            s($fileinfo->supportedextensions),
        ],
    ];
    if (isset($fileinfo->duration)) {
        $table->data[] = [
            get_string('test_extraction_duration', 'local_ai_content'),
            $fileinfo->duration . ' s',
        ];
    }

    echo $OUTPUT->heading(get_string('test_extraction_fileinfo', 'local_ai_content'), 3);
    echo html_writer::table($table);
}

if ($errormessage !== '') {
    echo $OUTPUT->notification($errormessage, 'error');
}

if ($result !== '') {
    echo $OUTPUT->heading(get_string('test_extraction_result', 'local_ai_content'), 3);
    echo html_writer::tag('pre', s($result), ['class' => 'p-3 border bg-light', 'style' => 'white-space: pre-wrap;']);
}

if (!empty($fileinfo->mtrace)) {
    echo $OUTPUT->heading(get_string('test_extraction_log', 'local_ai_content'), 3);
    echo html_writer::tag('pre', s($fileinfo->mtrace), ['class' => 'p-3 border bg-secondary text-white small']);
}

// Always show the form.
echo $OUTPUT->heading(get_string('test_extraction_upload', 'local_ai_content'), 3);
$form->display();
echo $OUTPUT->footer();

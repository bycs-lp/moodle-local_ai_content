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

use local_ai_content\persistent\contentconfig;
use local_ai_content\form\ragcontexts;

/**
 * Registers the ragcontexts form element.
 *
 * Call this function before creating forms that use the ragcontexts element.
 * Typically called in a form's definition() method or in a plugin callback.
 *
 * @since Moodle 5.0
 */
function local_ai_content_register_form_elements() {
    global $CFG;
    // Register the ragcontexts element type
    // require_once($CFG->libdir . '/form/templatable_form_element.php');
    
    \MoodleQuickForm::registerElementType(
        'ragcontexts',
        __DIR__ . '/classes/form/ragcontexts.php',
        'local_ai_content\form\ragcontexts'
    );
}

local_ai_content_register_form_elements();
/**
 * Callback implementations for AI Content Manager
 *
 * @package    local_ai_content
 * @copyright  2026 YOUR NAME <your@email.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
function local_ai_content_coursemodule_edit_post_actions($data, $course) {
    global $DB, $USER;
    // var_dump($data);
    // exit();
    $isenabled = true; //\aipurpose_rag\indexer_manager::is_rag_indexing_enabled()$isenabled = true; //\aipurpose_rag\indexer_manager::is_rag_indexing_enabled()
    if ($isenabled) {
       // RAG indexing is enabled.
       // A "falsey" value will cause the resource to be not indexed.
       // Only a "proper" truth-y value will cause the resource to be indexed.
       $tx = $DB->start_delegated_transaction();
       $oldallowindexvalue = null;
       $context = \context_module::instance($data->coursemodule);
       if ($cmconfig = contentconfig::get_record(['cmid' => $data->coursemodule])) {
            $oldallowindexvalue = $cmconfig->get('allowindex');
            $cmconfig->set('allowindex', !empty($data->allowindexing) ? 1 : 0);
            $cmconfig->set('contextid', $context->id);
         } else {
              $record = new \stdClass();
              $record->cmid = $data->coursemodule;
              $record->contextid = $context->id;
              $record->allowindex = !empty($data->allowindexing) ? 1 : 0;
              $record->usermodified = $USER->id;
              $cmconfig = new contentconfig(0, $record);
              
              $cmconfig->save();
       }
       $tx->allow_commit();
       if (!is_null($oldallowindexvalue)) {
            if ($oldallowindexvalue === 0 & $data->allowindexing) {
                // Turning off to on.
            } else if ($oldallowindexvalue === 1 & empty($data->allowindexing)) {
                // Turning on to off.
                // We should schedule a deindexing task.
            }
       } // Otherwise a new record, we don't care if it's changing state.
   }
    return $data;
}
function local_ai_content_coursemodule_standard_elements($formwrapper, $mform) {
    $isenabled = true; //\aipurpose_rag\indexer_manager::is_rag_indexing_enabled()

    if ($isenabled) {
        $cmconfig = contentconfig::get_record(['cmid' => $formwrapper->get_coursemodule()->id]);
        $mform->addElement('header', 'aicontent', get_string('aicontent', 'local_ai_content'));
        $ynoptions = [0 => get_string('no'), 1 => get_string('yes')];
        $mform->addElement('select', 'allowindexing', get_string('allowindexing', 'local_ai_content'), $ynoptions);
        if ($cmconfig !== false && $cmconfig->get('allowindex') == 1) {
            
            $mform->setDefault('allowindexing', 1);
        } else {
            $mform->setDefault('allowindexing', 0);
        }
    }
    // This was just to test that the helper function get all AI configs all modules in course works.
    // print_r(contentconfig::get_course_module_configs($formwrapper->get_course()));
}
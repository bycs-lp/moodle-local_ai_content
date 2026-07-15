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

namespace local_ai_content\form;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/formslib.php');

/**
 * Form for testing text extraction from uploaded files.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class testextraction_form extends \moodleform {
    /**
     * Define form elements.
     */
    protected function definition() {
        $mform = $this->_form;

        $mform->addElement(
            'filepicker',
            'testfile',
            get_string('testextraction_file', 'local_ai_content'),
            null,
            ['maxbytes' => 10 * 1024 * 1024, 'accepted_types' => '*']
        );
        $mform->addRule('testfile', get_string('required'), 'required', null, 'client');

        $this->add_action_buttons(false, get_string('testextraction_submit', 'local_ai_content'));
    }
}

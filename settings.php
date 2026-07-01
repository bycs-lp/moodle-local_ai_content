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
 * Settings file for local_ai_content.
 *
 * @package    local_ai_content
 * @copyright  2026 MoodleDach
 * @author
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage(
        'local_ai_content_settings',
        get_string('pluginname', 'local_ai_content'),
        'moodle/site:config',
        false
    );

    // Setting: Show empty sections in RAG contexts selector
    $settings->add(new admin_setting_configcheckbox(
        'local_ai_content/showemptysections',
        get_string('showemptysections', 'local_ai_content'),
        get_string('showemptysections_desc', 'local_ai_content'),
        0, // Default value: false (don't show empty sections)
        PARAM_BOOL
    ));

    $ADMIN->add('localplugins', $settings);
}

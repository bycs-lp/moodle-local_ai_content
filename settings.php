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
 * Admin settings for local_ai_content.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    // Create category for AI Content Manager.
    $ADMIN->add('localplugins', new admin_category(
        'local_ai_content_category',
        get_string('pluginname', 'local_ai_content')
    ));

    $settings = new admin_settingpage('local_ai_content', get_string('settings'));

    // AI backend selection.
    $settings->add(new admin_setting_configselect(
        'local_ai_content/backend',
        get_string('backend', 'local_ai_content'),
        get_string('backend_desc', 'local_ai_content'),
        \local_ai_content\backend\config::DEFAULT_BACKEND,
        \local_ai_content\backend\config::get_backend_options()
    ));

    // Cache TTL in days.
    $settings->add(new admin_setting_configtext(
        'local_ai_content/cachettl',
        get_string('cachettl', 'local_ai_content'),
        get_string('cachettl_desc', 'local_ai_content'),
        '90',
        PARAM_INT
    ));

    $ADMIN->add('local_ai_content_category', $settings);

    // Test extraction admin page.
    $ADMIN->add('local_ai_content_category', new admin_externalpage(
        'local_ai_content_test_extraction',
        get_string('test_extraction', 'local_ai_content'),
        new moodle_url('/local/ai_content/pages/test_extraction.php'),
        'local/ai_content:useextraction'
    ));
}

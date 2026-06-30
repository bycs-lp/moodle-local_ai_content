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

namespace local_ai_content\persistent;

use core\persistent;
use core_course\modinfo;
/**
 * Class contentconfig
 *
 * @package    local_ai_content
 * @copyright  2026 YOUR NAME <your@email.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class contentconfig extends persistent {
    const TABLE = 'local_ai_content_config';

    /**
     * Define the properties of this persistent.
     *
     * @return array
     */
    protected static function define_properties() {
        return [
            'cmid' => [
                'type' => PARAM_INT,
                'description' => 'The course module ID for the configuration setting.',
                'default' => 0,
            ],
            'contextid' => [
                'type' => PARAM_INT,
                'description' => 'The context ID for the configuration setting.',
                'default' => 0,
            ],
            'allowindex' => [
                'type' => PARAM_BOOL,
                'description' => 'Whether indexing is allowed for this configuration setting.',
                'default' => false,
            ],
        ];
    }

    public static function get_course_module_configs($course) {
        global $DB;
        $records = [];
        // $course = get_course($course);
        $context = \context_course::instance($course->id);
        $activities = modinfo::get_array_of_activities($course);
        $cmids = array_keys($activities);
        $records = $DB->get_records_list(self::TABLE, 'cmid', $cmids);
        return $records;
    }
}

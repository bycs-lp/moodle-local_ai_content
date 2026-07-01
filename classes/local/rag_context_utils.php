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

namespace local_ai_content\local;

use local_ai_content\persistent\ragselection;

/**
 * Utility functions for RAG context selection.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class rag_context_utils {

    /**
     * Return all local_ai_content_config records that have allowindex = 1 and belong to
     * the course associated with the given context.
     *
     * Each entry in the returned array contains:
     *  - id   (int)    the local_ai_content_config record ID
     *  - cmid (int)    the course module ID
     *  - name (string) the activity name
     *
     * @param int $contextid Any Moodle context ID; the course context is derived from it.
     * @return array Array of associative arrays as described above.
     */
    public static function get_available_ragrecords_for_context(int $contextid): array {
        global $DB, $USER;

        $context = \context_helper::instance_by_id($contextid);

        // Climb up to the nearest course context.
        $coursecontext = $context->get_course_context(false);
        if (!$coursecontext) {
            return [];
        }

        $course = get_course($coursecontext->instanceid);
        $modinfo = get_fast_modinfo($course);
        $cms = $modinfo->get_cms();
        if (empty($cms)) {
            return [];
        }

        $cmids = array_map(
            static fn($cm) => (int) $cm->id,
            $cms,
        );
        $configrecords = $DB->get_records_list('local_ai_content_config', 'cmid', $cmids);
        $configbycmid = [];
        foreach ($configrecords as $record) {
            $configbycmid[(int) $record->cmid] = $record;
        }

        $result = [];
        // TODO: Remove this temporary hack and stop auto-creating config entries here.
        foreach ($cms as $cm) {
            $config = $configbycmid[(int) $cm->id] ?? null;
            if ($config === null) {
                // Temporary hack: missing records are treated as indexable by creating a config entry.
                $now = time();
                $config = (object) [
                    'cmid' => (int) $cm->id,
                    'contextid' => \context_module::instance((int) $cm->id)->id,
                    'allowindex' => 1,
                    'lastindexed' => 0,
                    'usermodified' => isset($USER->id) ? (int) $USER->id : 0,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ];
                $config->id = (int) $DB->insert_record('local_ai_content_config', $config);
            }

            $result[] = [
                'id' => (int) $config->id,
                'cmid' => (int) $cm->id,
                'name' => $cm->name,
            ];
        }

        return $result;
    }

    /**
     * Return only the IDs of available local_ai_content_config records for a context.
     *
     * Convenience wrapper around {@see get_available_ragrecords_for_context()}.
     *
     * @param int $contextid Any Moodle context ID.
     * @return int[] Array of local_ai_content_config record IDs.
     */
    public static function get_available_ragrecordids_for_context(int $contextid): array {
        $records = self::get_available_ragrecords_for_context($contextid);
        return array_column($records, 'id');
    }

    /**
     * Return the currently saved ragrecordids string for a context, or null.
     *
     * @param int $contextid The Moodle context ID.
     * @return string|null The stored comma-separated IDs, or null if nothing is saved.
     */
    public static function get_selected_ragrecordids(int $contextid): ?string {
        $records = ragselection::get_records(['contextid' => $contextid]);
        if (empty($records)) {
            return null;
        }
        $record = reset($records);
        return $record->get('ragrecordids');
    }

    /**
     * Save (upsert) the selected ragrecordids for a context.
     *
     * @param int $contextid The Moodle context ID.
     * @param string $ragrecordids Comma-separated list of local_ai_content_config record IDs.
     */
    public static function save_selected_ragrecordids(int $contextid, string $ragrecordids): void {
        $records = ragselection::get_records(['contextid' => $contextid]);
        if (!empty($records)) {
            $record = reset($records);
            $record->set('ragrecordids', $ragrecordids);
            $record->update();
        } else {
            $record = new ragselection(0, (object)[
                'contextid'    => $contextid,
                'ragrecordids' => $ragrecordids,
            ]);
            $record->create();
        }
    }
}





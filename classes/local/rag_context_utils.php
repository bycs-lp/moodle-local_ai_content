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

use local_ai_content\source;
use local_ai_content\source_selection;

/**
 * Utility functions for source selection.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class rag_context_utils {

    /**
     * Return all local_ai_content_sources records that have allowindex = 1 and belong to
     * the course associated with the given context.
     *
     * Each entry in the returned array contains:
     *  - id   (int)    the local_ai_content_sources record ID
     *  - cmid (int)    the course module ID
     *  - name (string) the activity name
     *
     * @param int $contextid Any Moodle context ID; the course context is derived from it.
     * @return array Array of associative arrays as described above.
     */
    public static function get_available_sources_for_context(int $contextid): array {
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

        $cmids = array_map(static fn($cm): int => (int) $cm->id, $cms);
        $sourcerecords = source::get_records_by_cmids($cmids);
        $sourcebycmid = [];
        foreach ($sourcerecords as $source) {
            if ($source->get_cmid() !== null) {
                $sourcebycmid[$source->get_cmid()] = $source;
            }
        }

        $result = [];
        foreach ($cms as $cm) {
            $source = $sourcebycmid[(int) $cm->id] ?? null;
            if ($source === null) {
                continue;
            }
            if (!$source->get_allowindex()) {
                continue;
            }
            $result[] = [
                'id' => $source->get_id(),
                'cmid' => (int) $cm->id,
                'name' => $cm->name,
            ];
        }

        return $result;
    }

    /**
     * Return only the IDs of available local_ai_content_sources records for a context.
     *
     * Convenience wrapper around {@see get_available_sources_for_context()}.
     *
     * @param int $contextid Any Moodle context ID.
     * @return int[] Array of local_ai_content_sources record IDs.
     */
    public static function get_available_sourceids_for_context(int $contextid): array {
        $records = self::get_available_sources_for_context($contextid);
        return array_column($records, 'id');
    }

    /**
     * Return the currently saved sourceids string for a context, or null.
     *
     * @param int $contextid The Moodle context ID.
     * @return ?string The stored comma-separated IDs, or null if nothing is saved.
     */
    public static function get_selected_sourceids(int $contextid): ?string {
        $selection = source_selection::get_by_contextid($contextid);
        if ($selection === null) {
            return null;
        }
        return implode(',', $selection->get_sourceids());
    }

    /**
     * Save (upsert) the selected sourceids for a context.
     *
     * @param int $contextid The Moodle context ID.
     * @param string $sourceids Comma-separated list of local_ai_content_sources record IDs.
     */
    public static function save_selected_sourceids(int $contextid, string $sourceids): void {
        $selection = source_selection::get_by_contextid($contextid);
        if ($selection === null) {
            $selection = new source_selection();
            $selection->set_contextid($contextid);
        }
        $sourceidsarray = [];
        if ($sourceids !== '') {
            $sourceidsarray = explode(',', $sourceids);
        }
        $selection->set_sourceids($sourceidsarray);
        $selection->store();
    }
}




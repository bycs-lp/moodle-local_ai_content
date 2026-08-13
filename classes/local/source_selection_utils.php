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

use local_ai_content\context_source;
use local_ai_content\source;

/**
 * Utility functions for context-specific source selection.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_selection_utils {
    /**
     * Return all sources selectable for this context.
     *
     * The available sources are:
     *  - module sources of the course the context belongs to that have allowindex = 1;
     *  - document and external sources attached to any context on the path from the system context down to the
     *    given context (i.e. the context itself and all its ancestors).
     *
     * Each entry in the returned array contains:
     *  - id         (int)     the local_ai_content_sources record ID
     *  - cmid       (?int)    the course module ID for module sources, null otherwise
     *  - name       (string)  the source display name
     *  - sourcetype (string)  one of source::TYPE_*
     *
     * @param int $contextid Any Moodle context ID.
     * @return array Array of associative arrays as described above.
     */
    public static function get_available_sources_for_context(int $contextid): array {
        $context = \context_helper::instance_by_id($contextid);
        $result = [];

        // Module sources of the course this context belongs to.
        $coursecontext = $context->get_course_context(false);
        if ($coursecontext) {
            $course = get_course($coursecontext->instanceid);
            $modinfo = get_fast_modinfo($course);
            $cms = $modinfo->get_cms();
            if (!empty($cms)) {
                $cmids = array_map(static fn($cm): int => (int) $cm->id, $cms);
                $modulesources = source::get_records_by_cmids($cmids);
                $sourcebycmid = [];
                foreach ($modulesources as $modulesource) {
                    if ($modulesource->get_cmid() !== null) {
                        $sourcebycmid[$modulesource->get_cmid()] = $modulesource;
                    }
                }
                foreach ($cms as $cm) {
                    $modulesource = $sourcebycmid[(int) $cm->id] ?? null;
                    if ($modulesource === null || !$modulesource->get_allowindex()) {
                        continue;
                    }
                    $result[$modulesource->get_id()] = [
                        'id' => $modulesource->get_id(),
                        'cmid' => (int) $cm->id,
                        'name' => $cm->name,
                        'sourcetype' => $modulesource->get_sourcetype(),
                    ];
                }
            }
        }

        // Document and external sources attached to the context path (self + ancestors).
        $pathcontextids = self::get_context_path_ids($context);
        $pathsources = source::get_records_by_contextids($pathcontextids);
        foreach ($pathsources as $pathsource) {
            if ($pathsource->get_sourcetype() === source::TYPE_MODULE) {
                continue;
            }
            if (!$pathsource->get_enabled()) {
                continue;
            }
            $result[$pathsource->get_id()] = [
                'id' => $pathsource->get_id(),
                'cmid' => $pathsource->get_cmid(),
                'name' => (string) $pathsource->get_name(),
                'sourcetype' => $pathsource->get_sourcetype(),
            ];
        }

        return array_values($result);
    }

    /**
     * Return the context ids on the path from the system context down to the given context.
     *
     * @param \context $context The context to resolve the path for.
     * @return int[] The context ids including the given context and all its ancestors.
     */
    public static function get_context_path_ids(\context $context): array {
        $ids = $context->get_parent_context_ids(true);
        return array_values(array_map('intval', $ids));
    }

    /**
     * Return only the IDs of selectable local_ai_content_sources records for a context.
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
     * Return the currently saved selected source IDs for a context, or null.
     *
     * @param int $contextid The Moodle context ID.
     * @return ?string The stored comma-separated IDs, or null if nothing is saved.
     */
    public static function get_selected_sourceids(int $contextid): ?string {
        $sourceids = context_source::get_sourceids_for_context($contextid);
        if (empty($sourceids)) {
            return null;
        }
        return implode(',', $sourceids);
    }

    /**
     * Save (replace) the selected source IDs for a context.
     *
     * @param int $contextid The Moodle context ID.
     * @param string $sourceids Comma-separated list of local_ai_content_sources record IDs.
     */
    public static function save_selected_sourceids(int $contextid, string $sourceids): void {
        $sourceidsarray = $sourceids === '' ? [] : explode(',', $sourceids);
        context_source::set_sourceids_for_context($contextid, $sourceidsarray);
    }
}

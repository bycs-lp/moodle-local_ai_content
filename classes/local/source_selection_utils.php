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
        $groups = self::get_grouped_sources_for_context($contextid);
        return array_values(array_merge(
            $groups['globaldocuments'],
            $groups['courseactivities'],
            $groups['externalsources'],
        ));
    }

    /**
     * Return grouped selectable sources for the source-selection UI.
     *
     * @param int $contextid Any Moodle context ID.
     * @return array{
     *   globaldocuments: array,
     *   courseactivities: array,
     *   externalsources: array
     * }
     */
    public static function get_grouped_sources_for_context(int $contextid): array {
        global $USER;

        $context = \context_helper::instance_by_id($contextid);
        $coursecontext = $context->get_course_context(false);
        $userid = (int)($USER->id ?? 0);
        $globaldocuments = self::get_global_document_sources($userid);

        if ($coursecontext === false) {
            return [
                'globaldocuments' => $globaldocuments,
                'courseactivities' => [],
                'externalsources' => [],
            ];
        }

        $courseactivities = self::get_course_activity_sources($coursecontext, $userid);

        $selectedsourceids = context_source::get_sourceids_for_context($contextid);
        $externalsources = self::get_selected_external_sources($selectedsourceids, $coursecontext, $globaldocuments, $courseactivities, $userid);

        return [
            'globaldocuments' => $globaldocuments,
            'courseactivities' => $courseactivities,
            'externalsources' => $externalsources,
        ];
    }

    /**
     * Return courses from which a user can add external sources.
     *
     * @param int $contextid Any Moodle context ID.
     * @return array<int, array{id:int,name:string,shortname:string}>
     */
    public static function get_importable_courses_for_context(int $contextid): array {
        global $DB;

        $context = \context_helper::instance_by_id($contextid);
        $coursecontext = $context->get_course_context(false);
        if ($coursecontext === false) {
            return [];
        }

        $records = $DB->get_records_select('course', 'id <> :siteid', ['siteid' => SITEID], 'fullname ASC', 'id, fullname, shortname');
        $courses = [];
        foreach ($records as $record) {
            if ((int)$record->id === (int)$coursecontext->instanceid) {
                continue;
            }
            $sourcecoursecontext = \context_course::instance((int)$record->id, IGNORE_MISSING);
            if (!$sourcecoursecontext) {
                continue;
            }
            if (!has_capability('moodle/course:view', $sourcecoursecontext) || !has_capability('local/ai_content:usesource', $sourcecoursecontext)) {
                continue;
            }
            $courses[] = [
                'id' => (int)$record->id,
                'name' => format_string($record->fullname, true, ['context' => $sourcecoursecontext]),
                'shortname' => (string)$record->shortname,
            ];
        }

        return $courses;
    }

    /**
     * Return importable source options for one selected course.
     *
     * @param int $contextid Any Moodle context ID.
     * @param int $sourcecourseid Course ID to load source options from.
     * @return array{courseactivities: array, coursedocuments: array}
     */
    public static function get_importable_sources_for_course(int $contextid, int $sourcecourseid): array {
        global $USER;

        $context = \context_helper::instance_by_id($contextid);
        $targetcoursecontext = $context->get_course_context(false);
        if ($targetcoursecontext === false || $sourcecourseid <= 0 || $sourcecourseid === (int)$targetcoursecontext->instanceid) {
            return [
                'courseactivities' => [],
                'coursedocuments' => [],
            ];
        }

        $sourcecoursecontext = \context_course::instance($sourcecourseid, MUST_EXIST);
        require_capability('moodle/course:view', $sourcecoursecontext);
        require_capability('local/ai_content:usesource', $sourcecoursecontext);

        $userid = (int)($USER->id ?? 0);
        $courseactivities = [];
        $modinfo = get_fast_modinfo($sourcecourseid, $userid);
        $cms = $modinfo->get_cms();
        if (!empty($cms)) {
            $cmids = array_map(static fn($cm): int => (int)$cm->id, $cms);
            $modulesources = source::get_records_by_cmids($cmids);
            $sourcebycmid = [];
            foreach ($modulesources as $modulesource) {
                if ($modulesource->get_cmid() !== null) {
                    $sourcebycmid[(int)$modulesource->get_cmid()] = $modulesource;
                }
            }

            foreach ($cms as $cm) {
                if (!$cm->uservisible) {
                    continue;
                }
                $modulesource = $sourcebycmid[(int)$cm->id] ?? null;
                if ($modulesource === null || !$modulesource->get_enabled() || !$modulesource->get_allowindex()) {
                    continue;
                }
                $courseactivities[] = [
                    'id' => (int)$modulesource->get_id(),
                    'cmid' => (int)$cm->id,
                    'name' => format_string($cm->name, true, ['context' => $cm->context]),
                    'sourcetype' => $modulesource->get_sourcetype(),
                    'origin' => format_string($modinfo->get_course()->fullname, true, ['context' => $sourcecoursecontext]),
                ];
            }
        }

        $coursedocuments = [];
        $sources = source::get_records_by_contextids([$sourcecoursecontext->id]);
        foreach ($sources as $documentsource) {
            if ($documentsource->get_sourcetype() === source::TYPE_MODULE || !$documentsource->get_enabled()) {
                continue;
            }
            if (!source_access::can_access_source($documentsource, $userid)) {
                continue;
            }
            $coursedocuments[] = [
                'id' => (int)$documentsource->get_id(),
                'cmid' => $documentsource->get_cmid(),
                'name' => (string)$documentsource->get_name(),
                'sourcetype' => (string)$documentsource->get_sourcetype(),
                'origin' => format_string($modinfo->get_course()->fullname, true, ['context' => $sourcecoursecontext]),
            ];
        }

        usort($courseactivities, static fn(array $a, array $b): int => strcmp((string)$a['name'], (string)$b['name']));
        usort($coursedocuments, static fn(array $a, array $b): int => strcmp((string)$a['name'], (string)$b['name']));

        return [
            'courseactivities' => $courseactivities,
            'coursedocuments' => $coursedocuments,
        ];
    }

    /**
     * Return global non-module sources the user may use.
     *
     * @param int $userid User ID.
     * @return array
     */
    private static function get_global_document_sources(int $userid): array {
        $systemcontext = \context_system::instance();
        if (!has_capability('local/ai_content:usesource', $systemcontext, $userid)) {
            return [];
        }

        $result = [];
        $sources = source::get_records_by_contextids([$systemcontext->id]);
        foreach ($sources as $pathsource) {
            if ($pathsource->get_sourcetype() === source::TYPE_MODULE || !$pathsource->get_enabled()) {
                continue;
            }
            $result[] = [
                'id' => (int)$pathsource->get_id(),
                'cmid' => $pathsource->get_cmid(),
                'name' => (string)$pathsource->get_name(),
                'sourcetype' => (string)$pathsource->get_sourcetype(),
                'origin' => get_string('coresystem'),
            ];
        }

        usort($result, static fn(array $a, array $b): int => strcmp((string)$a['name'], (string)$b['name']));
        return $result;
    }

    /**
     * Return indexed module sources (current course only) that are usable for RAG.
     *
     * @param \context_course $coursecontext
     * @param int $userid User ID.
     * @return array
     */
    private static function get_course_activity_sources(\context_course $coursecontext, int $userid): array {
        $course = get_course($coursecontext->instanceid);
        $modinfo = get_fast_modinfo($course, $userid);
        $cms = $modinfo->get_cms();
        if (empty($cms)) {
            return [];
        }

        $cmids = array_map(static fn($cm): int => (int)$cm->id, $cms);
        $modulesources = source::get_records_by_cmids($cmids);
        $sourcebycmid = [];
        foreach ($modulesources as $modulesource) {
            if ($modulesource->get_cmid() !== null) {
                $sourcebycmid[(int)$modulesource->get_cmid()] = $modulesource;
            }
        }

        $result = [];
        foreach ($cms as $cm) {
            if (!$cm->uservisible) {
                continue;
            }
            $modulesource = $sourcebycmid[(int)$cm->id] ?? null;
            if ($modulesource === null || !$modulesource->get_enabled() || !$modulesource->get_allowindex()) {
                continue;
            }
            $result[] = [
                'id' => (int)$modulesource->get_id(),
                'cmid' => (int)$cm->id,
                'name' => format_string($cm->name, true, ['context' => $cm->context]),
                'sourcetype' => (string)$modulesource->get_sourcetype(),
                'origin' => format_string($course->fullname, true, ['context' => $coursecontext]),
            ];
        }

        usort($result, static fn(array $a, array $b): int => strcmp((string)$a['name'], (string)$b['name']));
        return $result;
    }

    /**
     * Resolve currently selected foreign sources to show in the "external sources" section.
     *
     * @param int[] $selectedsourceids
     * @param \context_course $coursecontext
     * @param array $globaldocuments
     * @param array $courseactivities
     * @param int $userid
     * @return array
     */
    private static function get_selected_external_sources(
        array $selectedsourceids,
        \context_course $coursecontext,
        array $globaldocuments,
        array $courseactivities,
        int $userid,
    ): array {
        $localids = [];
        foreach (array_merge($globaldocuments, $courseactivities) as $localsource) {
            $localids[(int)$localsource['id']] = true;
        }

        $externalsources = [];
        $sources = source::get_records_by_ids($selectedsourceids);
        foreach ($sources as $selectedsource) {
            $sourceid = (int)$selectedsource->get_id();
            if (isset($localids[$sourceid])) {
                continue;
            }
            if (!source_access::can_access_source($selectedsource, $userid)) {
                continue;
            }
            if (!self::is_external_to_course($selectedsource, $coursecontext)) {
                continue;
            }
            $externalsources[] = [
                'id' => $sourceid,
                'cmid' => $selectedsource->get_cmid(),
                'name' => (string)$selectedsource->get_name(),
                'sourcetype' => (string)$selectedsource->get_sourcetype(),
                'origin' => self::resolve_source_origin_label($selectedsource),
            ];
        }

        usort($externalsources, static fn(array $a, array $b): int => strcmp((string)$a['name'], (string)$b['name']));
        return $externalsources;
    }

    /**
     * Whether a source belongs to another course than the active one.
     *
     * @param source $source
     * @param \context_course $coursecontext
     * @return bool
     */
    private static function is_external_to_course(source $source, \context_course $coursecontext): bool {
        if ($source->get_sourcetype() === source::TYPE_MODULE) {
            $cmid = (int)($source->get_cmid() ?? 0);
            if ($cmid <= 0) {
                return false;
            }
            $cm = get_coursemodule_from_id('', $cmid, 0, false, IGNORE_MISSING);
            if (!$cm) {
                return false;
            }
            return (int)$cm->course !== (int)$coursecontext->instanceid;
        }

        try {
            $sourcecontext = \context_helper::instance_by_id($source->get_contextid());
        } catch (\moodle_exception $e) {
            return false;
        }
        $sourcecoursecontext = $sourcecontext->get_course_context(false);
        if ($sourcecoursecontext === false) {
            return false;
        }
        return (int)$sourcecoursecontext->instanceid !== (int)$coursecontext->instanceid;
    }

    /**
     * Build human-readable origin label for a source.
     *
     * @param source $source
     * @return string
     */
    private static function resolve_source_origin_label(source $source): string {
        try {
            $sourcecontext = \context_helper::instance_by_id($source->get_contextid());
        } catch (\moodle_exception $e) {
            return '';
        }

        if ($sourcecontext->contextlevel === CONTEXT_SYSTEM) {
            return get_string('coresystem');
        }

        $coursecontext = $sourcecontext->get_course_context(false);
        if ($coursecontext === false) {
            return '';
        }

        $course = get_course($coursecontext->instanceid);
        return format_string($course->fullname, true, ['context' => $coursecontext]);
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

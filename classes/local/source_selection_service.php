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

/**
 * Service for context-specific source selection.
 *
 * Obtain it via dependency injection (constructor injection or {@see \core\di::get()}).
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_selection_service {
    /**
     * Constructor.
     *
     * @param embedding_model_resolver $modelresolver Resolver of the embedding model of the current user.
     * @param source_selection_store $selectionstore Store of the source selections of contexts.
     * @param source_access $sourceaccess Checks whether a user may retrieve from a source.
     * @param access_guard $accessguard Enforces the access rules for the current user.
     * @param course_structure $coursestructure Reader of the course structure.
     */
    public function __construct(
        /** @var embedding_model_resolver Resolver of the embedding model of the current user. */
        private readonly embedding_model_resolver $modelresolver,
        /** @var source_selection_store Store of the source selections of contexts. */
        private readonly source_selection_store $selectionstore,
        /** @var source_access Checks whether a user may retrieve from a source. */
        private readonly source_access $sourceaccess,
        /** @var access_guard Enforces the access rules for the current user. */
        private readonly access_guard $accessguard,
        /** @var course_structure Reader of the course structure. */
        private readonly course_structure $coursestructure,
    ) {
    }

    /**
     * Return all sources selectable for this context.
     *
     * The available sources are:
     *  - module sources of the course the context belongs to;
     *  - document and external sources attached to any context on the path from the system context down to the
     *    given context (i.e. the context itself and all its ancestors).
     *
     * Only sources passing {@see is_selectable()} are returned.
     *
     * Each entry in the returned array contains:
     *  - id            (int)     the local_ai_content_sources record ID
     *  - cmId          (?int)    the course module ID for module sources, null otherwise
     *  - name          (string)  the source display name
     *  - sourceType    (string)  one of source::TYPE_*
     *  - typeName      (string)  the human-readable type of the source (activity type for module sources)
     *  - iconUrl       (string)  the url of the activity icon for module sources, empty otherwise
     *  - origin        (string)  the name of the course or system the source belongs to
     *  - modes         (string[]) the selection modes the source can be selected with, see {@see get_selectable_modes()}
     *  - contentLength (?int)    the number of characters of the content, null if unknown
     *  - sectionId     (?int)    the id of the course section of activities in a course format with sections, null otherwise
     *  - outdated      (bool)    whether the index for the embedding model of the current user is outdated
     *
     * @param int $contextid Any Moodle context ID.
     * @return array Array of associative arrays as described above.
     */
    public function get_available_sources_for_context(int $contextid): array {
        $groups = $this->get_grouped_sources_for_context($contextid);
        return array_values(array_merge(
            $groups['globalDocuments'],
            $groups['courseActivities'],
            $groups['courseDocuments'],
            $groups['externalSources'],
        ));
    }

    /**
     * Return grouped selectable sources for the source-selection UI.
     *
     * The entries have the format described in {@see get_available_sources_for_context()}. The course activities are in
     * the order of the course page. In course formats with sections, courseSections lists the sections containing at least
     * one of the activities in course order, the activities reference them by sectionId.
     *
     * @param int $contextid Any Moodle context ID.
     * @return array{
     *   globalDocuments: array,
     *   courseActivities: array,
     *   courseDocuments: array,
     *   externalSources: array,
     *   courseSections: array<int, array{id: int, name: string}>
     * }
     */
    public function get_grouped_sources_for_context(int $contextid): array {
        global $USER;

        $context = \context_helper::instance_by_id($contextid);
        $coursecontext = $context->get_course_context(false);
        $userid = (int)$USER->id;
        $globaldocuments = $this->get_global_document_sources($userid);

        if ($coursecontext === false) {
            return $this->add_outdated_flags([
                'globalDocuments' => $globaldocuments,
                'courseActivities' => [],
                'courseDocuments' => [],
                'externalSources' => [],
            ]) + ['courseSections' => []];
        }

        [$courseactivities, $coursesections] = $this->get_course_activity_sources($coursecontext, $userid);
        $coursedocuments = $this->get_course_document_sources($coursecontext, $this->get_course_origin($coursecontext), $userid);

        $selectedsourceids = $this->selectionstore->get_sourceids_for_context($contextid);
        $externalsources = $this->get_selected_external_sources(
            $selectedsourceids,
            $coursecontext,
            array_merge($globaldocuments, $courseactivities, $coursedocuments),
            $userid,
        );

        return $this->add_outdated_flags([
            'globalDocuments' => $globaldocuments,
            'courseActivities' => $courseactivities,
            'courseDocuments' => $coursedocuments,
            'externalSources' => $externalsources,
        ]) + ['courseSections' => $coursesections];
    }

    /**
     * Return courses from which a user can add external sources.
     *
     * @param int $contextid Any Moodle context ID.
     * @return array<int, array{id:int,name:string,shortName:string}>
     */
    public function get_importable_courses_for_context(int $contextid): array {
        global $DB;

        $context = \context_helper::instance_by_id($contextid);
        $coursecontext = $context->get_course_context(false);
        if ($coursecontext === false) {
            return [];
        }

        $records = $DB->get_records_select('course', 'id <> :siteid', ['siteid' => SITEID], 'fullname ASC', 'id, fullname, shortname, visible');
        $courses = [];
        foreach ($records as $record) {
            if ((int)$record->id === (int)$coursecontext->instanceid) {
                continue;
            }
            $sourcecoursecontext = \context_course::instance((int)$record->id, IGNORE_MISSING);
            if (!$sourcecoursecontext) {
                continue;
            }
            if (!can_access_course($record, null, 'local/ai_content:usesource')) {
                continue;
            }
            $courses[] = [
                'id' => (int)$record->id,
                'name' => format_string($record->fullname, true, ['context' => $sourcecoursecontext]),
                'shortName' => (string)$record->shortname,
            ];
        }

        return $courses;
    }

    /**
     * Return importable source options for one selected course.
     *
     * @param int $contextid Any Moodle context ID.
     * @param int $sourcecourseid Course ID to load source options from.
     * @return array{courseActivities: array, courseDocuments: array}
     */
    public function get_importable_sources_for_course(int $contextid, int $sourcecourseid): array {
        global $USER;

        $context = \context_helper::instance_by_id($contextid);
        $targetcoursecontext = $context->get_course_context(false);
        if ($targetcoursecontext === false || $sourcecourseid <= 0 || $sourcecourseid === (int)$targetcoursecontext->instanceid) {
            return [
                'courseActivities' => [],
                'courseDocuments' => [],
            ];
        }

        $sourcecoursecontext = \context_course::instance($sourcecourseid, MUST_EXIST);
        $this->accessguard->require_capability('local/ai_content:usesource', $sourcecoursecontext);
        $this->accessguard->require_course_access($sourcecoursecontext);

        $userid = (int)$USER->id;
        $modinfo = get_fast_modinfo($sourcecourseid, $userid);
        $origin = format_string($modinfo->get_course()->fullname, true, ['context' => $sourcecoursecontext]);
        // The import list is flat, so the sections are not needed.
        [$courseactivities] = $this->get_module_entries($modinfo, $origin);

        return $this->add_outdated_flags([
            'courseActivities' => $courseactivities,
            'courseDocuments' => $this->get_course_document_sources($sourcecoursecontext, $origin, $userid),
        ]);
    }

    /**
     * Return the selectable document sources of a course the user may use, sorted by name.
     *
     * @param \context_course $coursecontext The context of the course.
     * @param string $origin The formatted name of the course.
     * @param int $userid User ID.
     * @return array[] The source entries.
     */
    private function get_course_document_sources(\context_course $coursecontext, string $origin, int $userid): array {
        $coursedocuments = [];
        foreach (source::get_records_by_contextids([$coursecontext->id]) as $documentsource) {
            if ($documentsource->get_sourcetype() === source::TYPE_MODULE || !$this->is_selectable($documentsource)) {
                continue;
            }
            if (!$this->sourceaccess->can_access_source($documentsource, $userid)) {
                continue;
            }
            $coursedocuments[] = $this->build_entry($documentsource, (string)$documentsource->get_name(), $origin);
        }

        usort($coursedocuments, static fn(array $a, array $b): int => strcmp((string)$a['name'], (string)$b['name']));
        return $coursedocuments;
    }

    /**
     * Return the formatted name of a course as origin of its sources.
     *
     * @param \context_course $coursecontext The context of the course.
     * @return string The formatted course name.
     */
    private function get_course_origin(\context_course $coursecontext): string {
        return format_string(get_course($coursecontext->instanceid)->fullname, true, ['context' => $coursecontext]);
    }

    /**
     * Add the flag "outdated" to grouped source entries.
     *
     * A source is outdated if its index for the embedding model of the current user is outdated, as this is the index
     * searched on retrieval.
     *
     * @param array<string, array[]> $groups Source entries grouped by any key, each entry with the key "id".
     * @return array<string, array[]> The groups with the key "outdated" added to every entry.
     */
    private function add_outdated_flags(array $groups): array {
        $model = $this->modelresolver->get_current_model();
        $sourceids = [];
        foreach ($groups as $entries) {
            foreach ($entries as $entry) {
                $sourceids[] = (int) $entry['id'];
            }
        }
        // Without an embedding model the user cannot search any source, so nothing is outdated for them.
        $indexes = $model === null ? [] : model_index::get_for_sources($sourceids);

        foreach ($groups as $key => $entries) {
            foreach ($entries as $position => $entry) {
                $index = $indexes[(int) $entry['id']][$model] ?? null;
                $groups[$key][$position]['outdated'] = $index?->get_status() === model_index::STATUS_OUTDATED;
            }
        }
        return $groups;
    }

    /**
     * Return global non-module sources the user may use.
     *
     * @param int $userid User ID.
     * @return array
     */
    private function get_global_document_sources(int $userid): array {
        $systemcontext = \context_system::instance();
        if (!has_capability('local/ai_content:useglobalsources', $systemcontext, $userid)) {
            return [];
        }

        $result = [];
        $sources = source::get_records_by_contextids([$systemcontext->id]);
        foreach ($sources as $pathsource) {
            if ($pathsource->get_sourcetype() === source::TYPE_MODULE || !$this->is_selectable($pathsource)) {
                continue;
            }
            $result[] = $this->build_entry($pathsource, (string)$pathsource->get_name(), get_string('coresystem'));
        }

        usort($result, static fn(array $a, array $b): int => strcmp((string)$a['name'], (string)$b['name']));
        return $result;
    }

    /**
     * Return the selectable module sources of the current course in the order of the course page.
     *
     * @param \context_course $coursecontext The context of the course.
     * @param int $userid User ID.
     * @return array{0: array[], 1: array[]} The source entries and the course sections containing them, see
     *  {@see get_module_entries()}.
     */
    private function get_course_activity_sources(\context_course $coursecontext, int $userid): array {
        $course = get_course($coursecontext->instanceid);
        $modinfo = get_fast_modinfo($course, $userid);
        return $this->get_module_entries($modinfo, format_string($course->fullname, true, ['context' => $coursecontext]));
    }

    /**
     * Build the entries of the selectable module sources of a course in the order of the course page.
     *
     * Activities of delegated sections (e.g. subsections) are listed after the module delegating the section, as part of
     * the section listed on the course page.
     *
     * @param \core_course\modinfo $modinfo The course module info of the course for the current user.
     * @param string $origin The formatted name of the course.
     * @return array{0: array[], 1: array<int, array{id: int, name: string}>} The source entries and, if the course format
     *  uses sections, the sections containing at least one entry (empty otherwise).
     */
    private function get_module_entries(\core_course\modinfo $modinfo, string $origin): array {
        $cms = $modinfo->get_cms();
        if (empty($cms)) {
            return [[], []];
        }

        $sourcebycmid = [];
        foreach (source::get_records_by_cmids(array_keys($cms)) as $modulesource) {
            $sourcebycmid[$modulesource->get_cmid()] = $modulesource;
        }

        $structure = $this->coursestructure->get_sections($modinfo);
        $usessections = $structure['usessections'];
        $entries = [];
        $sections = [];
        foreach ($structure['sections'] as $section) {
            $sectionhasentries = false;
            foreach ($section['cms'] as $cm) {
                $modulesource = $sourcebycmid[$cm->id] ?? null;
                if (!$cm->uservisible || $modulesource === null || !$this->is_selectable($modulesource)) {
                    continue;
                }
                $entry = $this->build_entry($modulesource, format_string($cm->name, true, ['context' => $cm->context]), $origin,
                    $cm);
                $entry['sectionId'] = $usessections ? $section['id'] : null;
                $entries[] = $entry;
                $sectionhasentries = true;
            }
            if ($usessections && $sectionhasentries) {
                $sections[] = ['id' => $section['id'], 'name' => $section['name']];
            }
        }
        return [$entries, $sections];
    }

    /**
     * Build the entry of a source for the source-selection UI.
     *
     * @param source $source The source.
     * @param string $name The formatted display name.
     * @param string $origin The formatted name of the course or system the source belongs to.
     * @param ?\core_course\cm_info $cm The course module of a module source, null for other sources.
     * @return array The entry in the format described in {@see get_available_sources_for_context()}.
     */
    private function build_entry(source $source, string $name, string $origin, ?\core_course\cm_info $cm = null): array {
        $typename = match ($source->get_sourcetype()) {
            source::TYPE_MODULE => $cm !== null ? $this->get_module_type_name($cm->modname) : '',
            source::TYPE_DOCUMENT => get_string('sourcetype_document', 'local_ai_content'),
            default => get_string('sourcetype_external', 'local_ai_content'),
        };
        return [
            'id' => $source->get_id(),
            'cmId' => $source->get_cmid(),
            'name' => $name,
            'sourceType' => $source->get_sourcetype(),
            'typeName' => $typename,
            'iconUrl' => $cm !== null ? $cm->get_icon_url()->out(false) : '',
            'origin' => $origin,
            'modes' => $this->get_selectable_modes($source),
            'contentLength' => $source->get_contentlength(),
            'sectionId' => null,
        ];
    }

    /**
     * Return the human-readable name of an activity type.
     *
     * @param string $modname The module type, e.g. 'page'.
     * @return string The name of the activity type.
     */
    private function get_module_type_name(string $modname): string {
        return get_string('modulename', 'mod_' . $modname);
    }

    /**
     * Resolve currently selected foreign sources to show in the "external sources" section.
     *
     * @param int[] $selectedsourceids
     * @param \context_course $coursecontext
     * @param array $localsources The entries of the sources already listed as global documents or sources of the course.
     * @param int $userid
     * @return array
     */
    private function get_selected_external_sources(
        array $selectedsourceids,
        \context_course $coursecontext,
        array $localsources,
        int $userid,
    ): array {
        $localids = [];
        foreach ($localsources as $localsource) {
            $localids[(int)$localsource['id']] = true;
        }

        $externalsources = [];
        $sources = source::get_records_by_ids($selectedsourceids);
        foreach ($sources as $selectedsource) {
            $sourceid = (int)$selectedsource->get_id();
            if (isset($localids[$sourceid])) {
                continue;
            }
            if (!$this->is_selectable($selectedsource)) {
                continue;
            }
            if (!$this->sourceaccess->can_access_source($selectedsource, $userid)) {
                continue;
            }
            if (!$this->is_external_to_course($selectedsource, $coursecontext)) {
                continue;
            }
            $externalsources[] = $this->build_entry($selectedsource, (string)$selectedsource->get_name(),
                $this->resolve_source_origin_label($selectedsource), $this->get_module_cm($selectedsource));
        }

        usort($externalsources, static fn(array $a, array $b): int => strcmp((string)$a['name'], (string)$b['name']));
        return $externalsources;
    }

    /**
     * Return the course module of a module source of another course.
     *
     * @param source $source The source.
     * @return ?\core_course\cm_info The course module, null for other source types.
     */
    private function get_module_cm(source $source): ?\core_course\cm_info {
        if ($source->get_sourcetype() !== source::TYPE_MODULE) {
            return null;
        }
        // The source has been checked to be accessible, so its course module exists.
        $cm = get_coursemodule_from_id('', $source->get_cmid(), 0, false, MUST_EXIST);
        return get_fast_modinfo($cm->course)->get_cm($cm->id);
    }

    /**
     * Return the selection modes a source can be selected with.
     *
     * Only enabled (shared) sources can be selected. The complete content can be added for Moodle sources (module/document),
     * which have content of their own. Searching needs retrievable vectors: Moodle sources once they have been indexed with
     * at least one embedding model, external sources always as their vectors are managed outside of Moodle. Whether a source
     * can be searched with the embedding model of a user is only decided on retrieval.
     *
     * @param source $source The source.
     * @return string[] The selection modes (source_selection_store::MODE_*), empty if the source cannot be selected.
     */
    public function get_selectable_modes(source $source): array {
        if (!$source->get_enabled()) {
            return [];
        }
        if ($source->get_sourcetype() === source::TYPE_EXTERNAL) {
            return [source_selection_store::MODE_SEARCH];
        }
        $modes = [source_selection_store::MODE_FULL];
        if (model_index::is_source_indexed($source->get_id())) {
            $modes[] = source_selection_store::MODE_SEARCH;
        }
        return $modes;
    }

    /**
     * Whether a source may be offered in the source selection with at least one selection mode.
     *
     * @param source $source The source.
     * @return bool True if the source is selectable, see {@see get_selectable_modes()}.
     */
    public function is_selectable(source $source): bool {
        return !empty($this->get_selectable_modes($source));
    }

    /**
     * Whether a source belongs to another course than the active one.
     *
     * @param source $source
     * @param \context_course $coursecontext
     * @return bool
     */
    private function is_external_to_course(source $source, \context_course $coursecontext): bool {
        if ($source->get_sourcetype() === source::TYPE_MODULE) {
            $cm = get_coursemodule_from_id('', $source->get_cmid(), 0, false, IGNORE_MISSING);
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
    private function resolve_source_origin_label(source $source): string {
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
    public function get_context_path_ids(\context $context): array {
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
    public function get_available_sourceids_for_context(int $contextid): array {
        $records = $this->get_available_sources_for_context($contextid);
        return array_column($records, 'id');
    }

    /**
     * Return the currently saved selection of a context.
     *
     * @param int $contextid The Moodle context ID.
     * @return array{selectedSourceIds: string, fullSourceIds: string} The comma-separated ids of all selected sources and
     *  of the sources selected with their complete content, empty if nothing is saved.
     */
    public function get_selection(int $contextid): array {
        return $this->format_selection($this->selectionstore->get_modes_for_context($contextid));
    }

    /**
     * Save (replace) the selection of a context.
     *
     * Selected sources are searched unless they are listed in $fullsourceids, then their complete content is used. Ids of
     * sources which do not exist, are not accessible for the current user or cannot be selected with the requested mode are
     * dropped.
     *
     * @param int $contextid The Moodle context ID.
     * @param string $sourceids Comma-separated list of the selected local_ai_content_sources record IDs.
     * @param string $fullsourceids Comma-separated list of the selected source IDs whose complete content is used.
     * @return array{selectedSourceIds: string, fullSourceIds: string} The selection which has actually been stored, in the
     *  format of {@see get_selection()}.
     */
    public function save_selection(int $contextid, string $sourceids, string $fullsourceids = ''): array {
        global $USER;

        $requestedids = $sourceids === '' ? [] : explode(',', $sourceids);
        $fullids = $fullsourceids === '' ? [] : array_flip(array_map('intval', explode(',', $fullsourceids)));
        $sources = source::get_records_by_ids($requestedids);

        $modes = [];
        foreach ($sources as $sourceid => $source) {
            $mode = isset($fullids[$sourceid]) ? source_selection_store::MODE_FULL : source_selection_store::MODE_SEARCH;
            if (!in_array($mode, $this->get_selectable_modes($source), true)) {
                continue;
            }
            if ($this->sourceaccess->can_access_source($source, (int)$USER->id)) {
                $modes[$sourceid] = $mode;
            }
        }

        $this->selectionstore->set_selection_for_context($contextid, $modes);
        return $this->format_selection($modes);
    }

    /**
     * Format a selection for the API.
     *
     * @param array<int, string> $modes The selection mode indexed by source id.
     * @return array{selectedSourceIds: string, fullSourceIds: string} See {@see get_selection()}.
     */
    private function format_selection(array $modes): array {
        ksort($modes);
        $fullmodes = array_filter($modes, static fn(string $mode): bool => $mode === source_selection_store::MODE_FULL);
        return [
            'selectedSourceIds' => implode(',', array_keys($modes)),
            'fullSourceIds' => implode(',', array_keys($fullmodes)),
        ];
    }
}

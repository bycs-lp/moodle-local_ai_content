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

/**
 * Service behind the source management of a course: module sources of the course and course/global document sources.
 *
 * The callers have to enforce the course management access ({@see access_guard::require_manage_access()}) and pass the
 * resulting course context. Access to single document sources (course vs. global) is checked here.
 *
 * Obtain it via dependency injection.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_management_service {
    /** @var string Scope of document sources attached to the course. */
    public const SCOPE_COURSE = 'course';

    /** @var string Scope of document sources attached to the system context (global documents). */
    public const SCOPE_GLOBAL = 'global';

    /**
     * Constructor.
     *
     * @param index_service $indexservice Service controlling the indexing of sources.
     * @param source_content_reader $contentreader Reader of the indexable content of sources.
     * @param access_guard $accessguard Enforces the access rules for the current user.
     */
    public function __construct(
        /** @var index_service Service controlling the indexing of sources. */
        private readonly index_service $indexservice,
        /** @var source_content_reader Reader of the indexable content of sources. */
        private readonly source_content_reader $contentreader,
        /** @var access_guard Enforces the access rules for the current user. */
        private readonly access_guard $accessguard,
    ) {
    }

    /**
     * Return the module and document sources of a course for the management UI.
     *
     * @param \context_course $coursecontext The context of the course whose sources are managed.
     * @return array Course context id, whether global sources may be managed and the rows of modules, global and
     *     course documents.
     */
    public function get_overview(\context_course $coursecontext): array {
        $canmanageglobalsources = $this->accessguard->can_manage_global_sources();

        return [
            'coursecontextid' => $coursecontext->id,
            'canmanagesystemsources' => $canmanageglobalsources,
            'items' => [
                'modules' => $this->get_module_rows($coursecontext),
                'globaldocuments' => $this->get_document_rows(SYSCONTEXTID, $canmanageglobalsources),
                'coursedocuments' => $this->get_document_rows($coursecontext->id, true),
            ],
        ];
    }

    /**
     * Switch a module source on or off, creating the source if the module has none yet.
     *
     * Switching a source off stops its indexing.
     *
     * @param \context_course $coursecontext The context of the course whose sources are managed.
     * @param int $cmid The course module id.
     * @param bool $enabled Whether the source is enabled.
     */
    public function set_module_enabled(\context_course $coursecontext, int $cmid, bool $enabled): void {
        $modulesource = $this->get_or_create_module_source($coursecontext, $cmid);

        if (!$enabled) {
            $this->indexservice->stop($modulesource);
        }

        $modulesource->set_enabled($enabled);
        $modulesource->store();
    }

    /**
     * Create a document source in the course or, with the required capability, as global document.
     *
     * @param \context_course $coursecontext The context of the course whose sources are managed.
     * @param string $scope One of the SCOPE_* constants.
     * @param string $name The name of the document.
     * @param string $description The description of the document.
     * @param string $content The plain text content of the document.
     * @return source The created document source.
     */
    public function create_document(
        \context_course $coursecontext,
        string $scope,
        string $name,
        string $description,
        string $content,
    ): source {
        $documentsource = new source();
        $documentsource->set_contextid($this->resolve_document_contextid($coursecontext, $scope));
        $documentsource->set_sourcetype(source::TYPE_DOCUMENT);
        $documentsource->set_name($name);
        $documentsource->set_description($description);
        $documentsource->set_content($content);
        $documentsource->set_enabled(true);
        $documentsource->set_allowindex(false);
        $documentsource->store();
        return $documentsource;
    }

    /**
     * Switch a document source on or off. Switching a source off stops its indexing.
     *
     * @param \context_course $coursecontext The context of the course whose sources are managed.
     * @param int $sourceid The document source id.
     * @param bool $enabled Whether the source is enabled.
     */
    public function set_document_enabled(\context_course $coursecontext, int $sourceid, bool $enabled): void {
        $documentsource = $this->load_managed_document($coursecontext, $sourceid);

        if (!$enabled) {
            $this->indexservice->stop($documentsource);
        }

        $documentsource->set_enabled($enabled);
        $documentsource->store();
    }

    /**
     * Update a document source and re-index it if its content changed while indexing is switched on.
     *
     * @param \context_course $coursecontext The context of the course whose sources are managed.
     * @param int $sourceid The document source id.
     * @param ?string $name The new name, null to keep the current one.
     * @param ?string $description The new description, null to keep the current one.
     * @param ?string $content The new content, null to keep the current one.
     */
    public function update_document(
        \context_course $coursecontext,
        int $sourceid,
        ?string $name,
        ?string $description,
        ?string $content,
    ): void {
        $documentsource = $this->load_managed_document($coursecontext, $sourceid);

        $contentchanged = $content !== null && (string) $documentsource->get_content() !== $content;

        if ($name !== null) {
            $documentsource->set_name($name);
        }
        if ($description !== null) {
            $documentsource->set_description($description);
        }
        if ($content !== null) {
            $documentsource->set_content($content);
        }
        $documentsource->store();

        if ($contentchanged && $documentsource->get_allowindex()) {
            $this->indexservice->reindex_changed_source($documentsource);
        }
    }

    /**
     * Delete a document source together with its selections and vectors.
     *
     * @param \context_course $coursecontext The context of the course whose sources are managed.
     * @param int $sourceid The document source id.
     */
    public function delete_document(\context_course $coursecontext, int $sourceid): void {
        $this->indexservice->delete_source($this->load_managed_document($coursecontext, $sourceid));
    }

    /**
     * Return the API representation of one document source.
     *
     * @param source $documentsource The document source.
     * @return array The document source with its index state.
     */
    public function get_document_item(source $documentsource): array {
        return [
            'id' => $documentsource->get_id(),
            'contextId' => $documentsource->get_contextid(),
            'name' => (string) $documentsource->get_name(),
            'description' => (string) $documentsource->get_description(),
            'content' => (string) $documentsource->get_content(),
            'enabled' => $documentsource->get_enabled(),
            'indexState' => $this->indexservice->get_state($documentsource)->to_array(),
        ];
    }

    /**
     * Build the rows of all modules of the course that have a content extractor.
     *
     * @param \context_course $coursecontext The context of the course.
     * @return array[] The module rows sorted by name.
     */
    private function get_module_rows(\context_course $coursecontext): array {
        $cms = get_fast_modinfo($coursecontext->instanceid)->get_cms();
        if (empty($cms)) {
            return [];
        }

        $cmids = array_map(static fn($cm): int => (int) $cm->id, $cms);
        $modulesources = source::get_records_by_cmids($cmids);
        $sourcebycmid = [];
        foreach ($modulesources as $modulesource) {
            $sourcebycmid[$modulesource->get_cmid()] = $modulesource;
        }
        $states = $this->indexservice->get_states($modulesources);

        $rows = [];
        foreach ($cms as $cm) {
            if (!empty($cm->deletioninprogress)) {
                continue;
            }
            if ($this->contentreader->get_extractor_class((string) $cm->modname) === null) {
                continue;
            }
            $modulesource = $sourcebycmid[(int) $cm->id] ?? null;
            $rows[] = [
                'cmid' => (int) $cm->id,
                'modname' => (string) $cm->modname,
                'moddisplayname' => $this->get_module_display_name((string) $cm->modname),
                'name' => format_string($cm->name, true, ['context' => $cm->context]),
                'sourceid' => $modulesource ? $modulesource->get_id() : 0,
                'enabled' => $modulesource ? $modulesource->get_enabled() : false,
                'indexState' => $modulesource
                    ? $states[$modulesource->get_id()]->to_array()
                    : index_state::unmanaged()->to_array(),
            ];
        }

        usort($rows, static fn(array $a, array $b): int => strcmp($a['name'], $b['name']));
        return $rows;
    }

    /**
     * Build the rows of the document sources of one context.
     *
     * @param int $contextid The context id.
     * @param bool $canedit Whether the current user may edit the documents.
     * @return array[] The document rows sorted by name.
     */
    private function get_document_rows(int $contextid, bool $canedit): array {
        $sources = array_filter(
            source::get_records_by_contextids([$contextid]),
            static fn(source $source): bool => $source->get_sourcetype() === source::TYPE_DOCUMENT
        );
        $states = $this->indexservice->get_states($sources);
        $rows = [];
        foreach ($sources as $documentsource) {
            $rows[] = [
                'id' => $documentsource->get_id(),
                'name' => (string) $documentsource->get_name(),
                'description' => (string) $documentsource->get_description(),
                'content' => (string) $documentsource->get_content(),
                'enabled' => $documentsource->get_enabled(),
                'indexState' => $states[$documentsource->get_id()]->to_array(),
                'canedit' => $canedit,
            ];
        }

        usort($rows, static fn(array $a, array $b): int => strcmp($a['name'], $b['name']));
        return $rows;
    }

    /**
     * Load a document source and require the permission to manage it from the course.
     *
     * @param \context_course $coursecontext The context of the course whose sources are managed.
     * @param int $sourceid The document source id.
     * @return source The document source.
     * @throws \invalid_parameter_exception If there is no document source with this id.
     */
    private function load_managed_document(\context_course $coursecontext, int $sourceid): source {
        $source = source::get_record(['id' => $sourceid]);
        if ($source === null || $source->get_sourcetype() !== source::TYPE_DOCUMENT) {
            throw new \invalid_parameter_exception('Document source not found.');
        }
        $this->accessguard->require_document_manage_access($coursecontext, $source);
        return $source;
    }

    /**
     * Resolve the context of a new document from its scope.
     *
     * @param \context_course $coursecontext The context of the course whose sources are managed.
     * @param string $scope One of the SCOPE_* constants.
     * @return int The context id.
     * @throws \invalid_parameter_exception If the scope is unknown.
     */
    private function resolve_document_contextid(\context_course $coursecontext, string $scope): int {
        if ($scope === self::SCOPE_COURSE) {
            return $coursecontext->id;
        }

        if ($scope === self::SCOPE_GLOBAL) {
            $this->accessguard->require_manage_global_sources();
            return SYSCONTEXTID;
        }

        throw new \invalid_parameter_exception('Unsupported document scope: ' . $scope);
    }

    /**
     * Find the source of a course module of the course or create it (disabled).
     *
     * The name of an existing source is updated to the current name of the course module.
     *
     * @param \context_course $coursecontext The context of the course the module belongs to.
     * @param int $cmid The course module id.
     * @return source The module source.
     */
    private function get_or_create_module_source(\context_course $coursecontext, int $cmid): source {
        $cm = get_coursemodule_from_id('', $cmid, $coursecontext->instanceid, false, MUST_EXIST);
        $modulesource = source::get_record(['cmid' => $cmid, 'sourcetype' => source::TYPE_MODULE]);

        if ($modulesource === null) {
            $modulesource = new source();
            $modulesource->set_sourcetype(source::TYPE_MODULE);
            $modulesource->set_cmid($cmid);
            $modulesource->set_enabled(false);
            $modulesource->set_allowindex(false);
        }
        $modulesource->set_contextid($coursecontext->id);
        $modulesource->set_name((string) $cm->name);
        $modulesource->store();

        return $modulesource;
    }

    /**
     * Resolve the localized name of a module type.
     *
     * @param string $modname The module type, e.g. 'page'.
     * @return string The localized name, the module type itself if the module has no name string.
     */
    private function get_module_display_name(string $modname): string {
        if (get_string_manager()->string_exists('modulename', $modname)) {
            return get_string('modulename', $modname);
        }
        return $modname;
    }
}


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

namespace local_ai_content\route\api;

use core\param;
use core\router\route;
use core\router\schema\parameters\query_parameter;
use core\router\schema\objects\array_of_strings;
use core\router\schema\objects\scalar_type;
use core\router\schema\objects\schema_object;
use core\router\schema\response\content\payload_response_type;
use core\router\schema\response\payload_response;
use local_ai_content\local\index_service;
use local_ai_content\local\index_state;
use local_ai_content\source;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * REST API routes for source management.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class sourcemanagement {
    /**
     * Return module and document sources for management UI.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextid The active context id.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/sources',
        method: ['GET'],
        title: 'Get source management data',
        description: 'Returns module and document sources including indexing status and progress data.',
        pathtypes: [
            new \core\router\schema\parameters\path_parameter(
                name: 'contextId',
                type: param::INT,
                description: 'The Moodle context ID.',
            ),
        ],
        responses: [
            new \core\router\schema\response\response(
                statuscode: 200,
                description: 'OK',
            ),
        ],
    )]
    public function get_data(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId, MUST_EXIST);
        $coursecontext = self::require_manage_access($context);

        return new payload_response(
            payload: self::build_payload($coursecontext),
            request: $request,
            response: $response,
        );
    }

    /**
     * Return importable sources for one selected source course.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextid The active context id.
     * @param int $sourcecourseid The source course id.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/importable-sources',
        method: ['GET'],
        title: 'Get importable sources for one course',
        description: 'Returns importable activities and documents for one selected source course.',
        pathtypes: [
            new \core\router\schema\parameters\path_parameter(
                name: 'contextId',
                type: param::INT,
                description: 'The Moodle context ID.',
            ),
        ],
        queryparams: [
            new query_parameter(
                name: 'sourceCourseId',
                type: param::INT,
                description: 'The source course ID.',
                required: true,
            ),
        ],
        responses: [
            new \core\router\schema\response\response(
                statuscode: 200,
                description: 'OK',
            ),
        ],
    )]
    public function get_importables(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
        int $sourceCourseId,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId, MUST_EXIST);
        $coursecontext = self::require_manage_access($context);

        return new payload_response(
            payload: [
                'items' => self::get_importable_sources_for_course($coursecontext, $sourceCourseId),
                'pagination' => [
                    'page' => 1,
                    'pageSize' => 0,
                    'totalItems' => 0,
                ],
            ],
            request: $request,
            response: $response,
        );
    }

    /**
     * Update module source flags.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextId The active context id.
     * @param int $cmId The target module id.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/module-sources/{cmId}',
        method: ['PATCH'],
        title: 'Update module source',
        description: 'Updates enabled and indexing flags for one module source.',
        pathtypes: [
            new \core\router\schema\parameters\path_parameter(
                name: 'contextId',
                type: param::INT,
                description: 'The Moodle context ID.',
            ),
            new \core\router\schema\parameters\path_parameter(
                name: 'cmId',
                type: param::INT,
                description: 'The course module ID.',
            ),
        ],
        requestbody: new \core\router\schema\request_body(
            content: new payload_response_type(
                schema: new schema_object([
                    'enabled' => new scalar_type(param::BOOL),
                ]),
            ),
        ),
        responses: [
            new \core\router\schema\response\response(
                statuscode: 200,
                description: 'OK',
            ),
        ],
    )]
    public function update_module_source(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
        int $cmId,
        index_service $indexservice,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId, MUST_EXIST);
        $coursecontext = self::require_manage_access($context);
        $body = self::get_action_payload($request);

        self::toggle_module_enabled($coursecontext, $cmId, self::as_bool($body['enabled']), $indexservice);

        return new payload_response(
            payload: self::build_payload($coursecontext),
            request: $request,
            response: $response,
        );
    }

    /**
     * Create a document source.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextId The active context id.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/document-sources',
        method: ['POST'],
        title: 'Create document source',
        description: 'Creates one document source in the selected scope.',
        pathtypes: [
            new \core\router\schema\parameters\path_parameter(
                name: 'contextId',
                type: param::INT,
                description: 'The Moodle context ID.',
            ),
        ],
        requestbody: new \core\router\schema\request_body(
            content: new payload_response_type(
                schema: new schema_object([
                    'scope' => new scalar_type(param::ALPHA, true),
                    'name' => new scalar_type(param::RAW, true),
                    'description' => new scalar_type(param::RAW),
                    'content' => new scalar_type(param::RAW),
                ]),
            ),
        ),
        responses: [
            new \core\router\schema\response\response(
                statuscode: 201,
                description: 'Created',
            ),
        ],
    )]
    public function create_document_source(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId, MUST_EXIST);
        $coursecontext = self::require_manage_access($context);
        $body = self::get_action_payload($request);

        $documentsource = self::create_document(
            $coursecontext,
            clean_param((string)($body['scope'] ?? ''), PARAM_ALPHA),
            clean_param((string)($body['name'] ?? ''), PARAM_TEXT),
            clean_param((string)($body['description'] ?? ''), PARAM_RAW),
            clean_param((string)($body['content'] ?? ''), PARAM_RAW),
        );

        $location = '/api/rest/v2/local_ai_content/contexts/' . $contextId . '/document-sources/' . $documentsource->get_id();
        $createdresponse = $response->withStatus(201)->withHeader('Location', $location);

        return new payload_response(
            payload: [
                'item' => self::build_document_item_payload($documentsource),
            ],
            request: $request,
            response: $createdresponse,
        );
    }

    /**
     * Update one document source.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextId The active context id.
     * @param int $sourceId The document source id.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/document-sources/{sourceId}',
        method: ['PATCH'],
        title: 'Update document source',
        description: 'Updates one document source and/or toggles indexing flags.',
        pathtypes: [
            new \core\router\schema\parameters\path_parameter(
                name: 'contextId',
                type: param::INT,
                description: 'The Moodle context ID.',
            ),
            new \core\router\schema\parameters\path_parameter(
                name: 'sourceId',
                type: param::INT,
                description: 'The document source ID.',
            ),
        ],
        requestbody: new \core\router\schema\request_body(
            content: new payload_response_type(
                schema: new schema_object([
                    'enabled' => new scalar_type(param::BOOL),
                    'name' => new scalar_type(param::RAW),
                    'description' => new scalar_type(param::RAW),
                    'content' => new scalar_type(param::RAW),
                ]),
            ),
        ),
        responses: [
            new \core\router\schema\response\response(
                statuscode: 200,
                description: 'OK',
            ),
        ],
    )]
    public function update_document_source(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
        int $sourceId,
        index_service $indexservice,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId, MUST_EXIST);
        $coursecontext = self::require_manage_access($context);
        $body = self::get_action_payload($request);

        if (array_key_exists('enabled', $body)) {
            self::toggle_document_enabled($coursecontext, $sourceId, self::as_bool($body['enabled']), $indexservice);
        }

        if (array_key_exists('name', $body) || array_key_exists('description', $body) || array_key_exists('content', $body)) {
            $documentsource = self::load_document_source($sourceId);
            self::require_document_manage_access($coursecontext, $documentsource);

            $name = array_key_exists('name', $body) ?
                clean_param((string)$body['name'], PARAM_TEXT) : (string)$documentsource->get_name();
            $description = array_key_exists('description', $body) ?
                clean_param((string)$body['description'], PARAM_RAW) : (string)$documentsource->get_description();
            $content = array_key_exists('content', $body) ?
                clean_param((string)$body['content'], PARAM_RAW) : (string)$documentsource->get_content();

            self::update_document($coursecontext, $sourceId, $name, $description, $content, $indexservice);
        }

        return new payload_response(
            payload: self::build_payload($coursecontext),
            request: $request,
            response: $response,
        );
    }

    /**
     * Delete one document source.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextId The active context id.
     * @param int $sourceId The document source id.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/document-sources/{sourceId}',
        method: ['DELETE'],
        title: 'Delete document source',
        description: 'Deletes one document source and related mappings.',
        pathtypes: [
            new \core\router\schema\parameters\path_parameter(
                name: 'contextId',
                type: param::INT,
                description: 'The Moodle context ID.',
            ),
            new \core\router\schema\parameters\path_parameter(
                name: 'sourceId',
                type: param::INT,
                description: 'The document source ID.',
            ),
        ],
        responses: [
            new \core\router\schema\response\response(
                statuscode: 200,
                description: 'OK',
            ),
        ],
    )]
    public function delete_document_source(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
        int $sourceId,
        index_service $indexservice,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId, MUST_EXIST);
        $coursecontext = self::require_manage_access($context);

        self::delete_source($coursecontext, $sourceId, $indexservice);

        return new payload_response(
            payload: self::build_payload($coursecontext),
            request: $request,
            response: $response,
        );
    }

    /**
     * Import selected sources from another course.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextId The active context id.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/sources',
        method: ['POST'],
        title: 'Create imported sources',
        description: 'Creates sources in this context by importing selected items from one source course.',
        pathtypes: [
            new \core\router\schema\parameters\path_parameter(
                name: 'contextId',
                type: param::INT,
                description: 'The Moodle context ID.',
            ),
        ],
        requestbody: new \core\router\schema\request_body(
            content: new payload_response_type(
                schema: new schema_object([
                    'sourceCourseId' => new scalar_type(param::INT, true),
                    'selectedImportKeys' => new array_of_strings(param::RAW, param::RAW),
                ]),
            ),
        ),
        responses: [
            new \core\router\schema\response\response(
                statuscode: 200,
                description: 'OK',
            ),
        ],
    )]
    public function import_sources(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
        index_service $indexservice,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId, MUST_EXIST);
        $coursecontext = self::require_manage_access($context);
        $body = self::get_action_payload($request);

        self::import_sources_from_course(
            $coursecontext,
            (int)($body['sourceCourseId'] ?? 0),
            self::normalize_selected_import_keys($body['selectedImportKeys'] ?? []),
            $indexservice,
        );

        return new payload_response(
            payload: self::build_payload($coursecontext),
            request: $request,
            response: $response,
        );
    }

    /**
     * Enforce course-level source management capability.
     *
     * @param \context $context
     * @return \context_course
     */
    private static function require_manage_access(\context $context): \context_course {
        require_login();
        $coursecontext = $context->get_course_context(false);
        if (!$coursecontext) {
            throw new \required_capability_exception($context, 'local/ai_content:managesources', 'nopermissions', '');
        }
        require_capability('local/ai_content:managesources', $coursecontext);
        return $coursecontext;
    }

    /**
     * Resolve all context ids whose sources the current user may manage from the given context.
     *
     * @param \context $context The active context.
     * @return int[] Context ids.
     */
    public static function resolve_managed_contextids(\context $context): array {
        $coursecontext = self::require_manage_access($context);
        $systemcontext = \context_system::instance();

        $contextids = [$coursecontext->id];
        if (has_capability('local/ai_content:managesources', $systemcontext)) {
            $contextids[] = $systemcontext->id;
        }

        return $contextids;
    }

    /**
     * Build the response payload consumed by the management React app.
     *
     * @param \context_course $coursecontext
     * @return array
     */
    private static function build_payload(\context_course $coursecontext): array {
        $systemcontext = \context_system::instance();
        $canmanagesystemsources = has_capability('local/ai_content:managesources', $systemcontext);

        $modulerows = self::get_module_rows($coursecontext);
        $globaldocuments = self::get_document_rows($systemcontext->id, $canmanagesystemsources);
        $coursedocuments = self::get_document_rows($coursecontext->id, true);

        return [
            'coursecontextid' => $coursecontext->id,
            'canmanagesystemsources' => $canmanagesystemsources,
            'items' => [
                'modules' => $modulerows,
                'globaldocuments' => $globaldocuments,
                'coursedocuments' => $coursedocuments,
            ],
            'pagination' => [
                'page' => 1,
                'pageSize' => 1,
                'totalItems' => 1,
            ],
        ];
    }

    /**
     * Return courses from which sources may be imported.
     *
     * @param \context_course $targetcoursecontext
     * @return array
     */
    private static function get_importable_courses(\context_course $targetcoursecontext): array {
        global $DB;

        $records = $DB->get_records_select('course', 'id <> :siteid', ['siteid' => SITEID], 'fullname ASC', 'id, fullname, shortname');
        $courses = [];
        foreach ($records as $record) {
            if ((int)$record->id === (int)$targetcoursecontext->instanceid) {
                continue;
            }
            $context = \context_course::instance((int)$record->id, IGNORE_MISSING);
            if (!$context) {
                continue;
            }
            if (!has_capability('moodle/course:view', $context) || !has_capability('local/ai_content:usesource', $context)) {
                continue;
            }
            $courses[] = [
                'id' => (int)$record->id,
                'name' => format_string($record->fullname, true, ['context' => $context]),
                'shortname' => (string)$record->shortname,
            ];
        }

        return $courses;
    }

    /**
     * Return importable documents and activities for one source course.
     *
     * @param \context_course $targetcoursecontext
     * @param int $sourcecourseid
     * @return array
     */
    private static function get_importable_sources_for_course(\context_course $targetcoursecontext, int $sourcecourseid): array {
        if ($sourcecourseid <= 0 || $sourcecourseid === (int)$targetcoursecontext->instanceid) {
            return [];
        }

        $sourcecoursecontext = \context_course::instance($sourcecourseid, MUST_EXIST);
        self::require_import_source_access($sourcecoursecontext);

        $result = [];

        $modinfo = get_fast_modinfo($sourcecourseid);
        foreach ($modinfo->get_cms() as $cm) {
            if (!self::is_supported_module_type((string)$cm->modname)) {
                continue;
            }
            if (!$cm->uservisible) {
                continue;
            }
            $viewcapability = 'mod/' . $cm->modname . ':view';
            if (get_capability_info($viewcapability) !== null && !has_capability($viewcapability, $cm->context)) {
                continue;
            }
            $result[] = [
                'key' => 'module:' . (int)$cm->id,
                'type' => 'module',
                'name' => format_string($cm->name, true, ['context' => $cm->context]),
                'meta' => self::get_module_display_name((string)$cm->modname),
            ];
        }

        $documentsources = source::get_records_by_contextids([$sourcecoursecontext->id]);
        foreach ($documentsources as $documentsource) {
            if ($documentsource->get_sourcetype() !== source::TYPE_DOCUMENT) {
                continue;
            }
            if (!$documentsource->get_enabled()) {
                continue;
            }
            $result[] = [
                'key' => 'document:' . $documentsource->get_id(),
                'type' => 'document',
                'name' => (string)$documentsource->get_name(),
                'meta' => (string)$documentsource->get_description(),
            ];
        }

        usort($result, static fn(array $a, array $b): int => strcmp((string)$a['name'], (string)$b['name']));
        return $result;
    }

    /**
     * Import selected module/document sources from another course into the target course context.
     *
     * @param \context_course $targetcoursecontext
     * @param int $sourcecourseid
     * @param string[] $selectedkeys
     * @param index_service $indexservice
     */
    private static function import_sources_from_course(
        \context_course $targetcoursecontext,
        int $sourcecourseid,
        array $selectedkeys,
        index_service $indexservice,
    ): void {
        if ($sourcecourseid <= 0 || $sourcecourseid === (int)$targetcoursecontext->instanceid) {
            throw new \invalid_parameter_exception('Invalid source course id for import.');
        }

        $sourcecoursecontext = \context_course::instance($sourcecourseid, MUST_EXIST);
        self::require_import_source_access($sourcecoursecontext);

        foreach ($selectedkeys as $key) {
            [$type, $id] = self::parse_import_key($key);
            if ($type === 'module') {
                self::import_module_source($targetcoursecontext, $sourcecoursecontext, $id, $indexservice);
                continue;
            }
            if ($type === 'document') {
                self::import_document_source($targetcoursecontext, $sourcecoursecontext, $id);
            }
        }
    }

    /**
     * Import one module source from another course.
     *
     * @param \context_course $targetcoursecontext
     * @param \context_course $sourcecoursecontext
     * @param int $cmid
     * @param index_service $indexservice
     */
    private static function import_module_source(
        \context_course $targetcoursecontext,
        \context_course $sourcecoursecontext,
        int $cmid,
        index_service $indexservice,
    ): void {
        $cm = get_coursemodule_from_id('', $cmid, $sourcecoursecontext->instanceid, false, MUST_EXIST);
        $modinfo = get_fast_modinfo($sourcecoursecontext->instanceid);
        $cms = $modinfo->get_cms();
        if (!isset($cms[$cmid]) || !$cms[$cmid]->uservisible) {
            throw new \required_capability_exception($sourcecoursecontext, 'moodle/course:view', 'nopermissions', '');
        }

        $viewcapability = 'mod/' . $cms[$cmid]->modname . ':view';
        if (get_capability_info($viewcapability) !== null && !has_capability($viewcapability, $cms[$cmid]->context)) {
            throw new \required_capability_exception($cms[$cmid]->context, $viewcapability, 'nopermissions', '');
        }

        $modulesource = source::get_record([
            'contextid' => $targetcoursecontext->id,
            'sourcetype' => source::TYPE_MODULE,
            'cmid' => $cmid,
        ]);
        if ($modulesource === null) {
            $modulesource = new source();
            $modulesource->set_contextid($targetcoursecontext->id);
            $modulesource->set_sourcetype(source::TYPE_MODULE);
            $modulesource->set_cmid($cmid);
        }

        $modulesource->set_name((string)$cm->name);
        $modulesource->set_enabled(true);
        $modulesource->store();

        $indexservice->start($modulesource);
    }

    /**
     * Import one document source from another course.
     *
     * @param \context_course $targetcoursecontext
     * @param \context_course $sourcecoursecontext
     * @param int $sourceid
     */
    private static function import_document_source(
        \context_course $targetcoursecontext,
        \context_course $sourcecoursecontext,
        int $sourceid,
    ): void {
        $source = source::get_record(['id' => $sourceid]);
        if ($source === null || $source->get_sourcetype() !== source::TYPE_DOCUMENT) {
            throw new \invalid_parameter_exception('Document source not found for import.');
        }
        if ((int)$source->get_contextid() !== (int)$sourcecoursecontext->id) {
            throw new \invalid_parameter_exception('Document source does not belong to selected source course.');
        }

        $documentsource = new source();
        $documentsource->set_contextid($targetcoursecontext->id);
        $documentsource->set_sourcetype(source::TYPE_DOCUMENT);
        $documentsource->set_name((string)$source->get_name());
        $documentsource->set_description((string)$source->get_description());
        $documentsource->set_content((string)$source->get_content());
        $documentsource->set_enabled(true);
        $documentsource->set_allowindex(false);
        $documentsource->set_indexstatus(source::INDEXSTATUS_IDLE);
        $documentsource->set_indextaskid(null);
        $documentsource->store();
    }

    /**
     * Parse one import selection key.
     *
     * @param string $key
     * @return array{0: string, 1: int}
     */
    private static function parse_import_key(string $key): array {
        $parts = explode(':', $key, 2);
        if (count($parts) !== 2) {
            throw new \invalid_parameter_exception('Invalid import key format.');
        }
        $type = clean_param($parts[0], PARAM_ALPHA);
        $id = (int)clean_param($parts[1], PARAM_INT);
        if (($type !== 'module' && $type !== 'document') || $id <= 0) {
            throw new \invalid_parameter_exception('Invalid import key payload.');
        }
        return [$type, $id];
    }

    /**
     * Normalize selected import keys payload.
     *
     * @param mixed $raw
     * @return string[]
     */
    private static function normalize_selected_import_keys(mixed $raw): array {
        if (is_array($raw)) {
            return array_values(array_filter(array_map(static fn($v): string => clean_param((string)$v, PARAM_RAW), $raw)));
        }
        $json = json_decode((string)$raw, true);
        if (is_array($json)) {
            return array_values(array_filter(array_map(static fn($v): string => clean_param((string)$v, PARAM_RAW), $json)));
        }
        return [];
    }

    /**
     * Require source course capabilities for imports.
     *
     * @param \context_course $sourcecoursecontext
     */
    private static function require_import_source_access(\context_course $sourcecoursecontext): void {
        require_capability('moodle/course:view', $sourcecoursecontext);
        require_capability('local/ai_content:usesource', $sourcecoursecontext);
    }

    /**
     * Build module rows for the course.
     *
     * @param \context_course $coursecontext
     * @return array
     */
    private static function get_module_rows(\context_course $coursecontext): array {
        $modinfo = get_fast_modinfo($coursecontext->instanceid);
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

        $rows = [];
        foreach ($cms as $cm) {
            if (!empty($cm->deletioninprogress)) {
                continue;
            }
            if (!self::is_supported_module_type((string)$cm->modname)) {
                continue;
            }
            $modulesource = $sourcebycmid[(int)$cm->id] ?? null;
            $rows[] = [
                'cmid' => (int)$cm->id,
                'modname' => (string)$cm->modname,
                'moddisplayname' => self::get_module_display_name((string)$cm->modname),
                'name' => format_string($cm->name, true, ['context' => $cm->context]),
                'sourceid' => $modulesource ? $modulesource->get_id() : 0,
                'enabled' => $modulesource ? $modulesource->get_enabled() : false,
                'indexState' => $modulesource
                    ? index_state::from_source($modulesource)->to_array()
                    : index_state::unmanaged()->to_array(),
            ];
        }

        usort($rows, static fn(array $a, array $b): int => strcmp($a['name'], $b['name']));
        return $rows;
    }

    /**
     * Build document rows for one context.
     *
     * @param int $contextid
     * @param bool $canedit
     * @return array
     */
    private static function get_document_rows(int $contextid, bool $canedit): array {
        $sources = source::get_records_by_contextids([$contextid]);
        $rows = [];
        foreach ($sources as $documentsource) {
            if ($documentsource->get_sourcetype() !== source::TYPE_DOCUMENT) {
                continue;
            }
            $rows[] = [
                'id' => $documentsource->get_id(),
                'name' => (string)$documentsource->get_name(),
                'description' => (string)$documentsource->get_description(),
                'content' => (string)$documentsource->get_content(),
                'enabled' => $documentsource->get_enabled(),
                'indexState' => index_state::from_source($documentsource)->to_array(),
                'canedit' => $canedit,
            ];
        }

        usort($rows, static fn(array $a, array $b): int => strcmp((string)$a['name'], (string)$b['name']));
        return $rows;
    }

    /**
     * Toggle module source enabled flag.
     *
     * @param \context_course $coursecontext
     * @param int $cmid
     * @param bool $enabled
     * @param index_service $indexservice
     */
    private static function toggle_module_enabled(
        \context_course $coursecontext,
        int $cmid,
        bool $enabled,
        index_service $indexservice,
    ): void {
        $modulesource = self::get_or_create_module_source($coursecontext, $cmid);

        if (!$enabled) {
            $indexservice->stop($modulesource);
        }

        $modulesource->set_enabled($enabled);
        $modulesource->store();
    }

    /**
     * Toggle document source enabled flag.
     *
     * @param \context_course $coursecontext
     * @param int $sourceid
     * @param bool $enabled
     * @param index_service $indexservice
     */
    private static function toggle_document_enabled(
        \context_course $coursecontext,
        int $sourceid,
        bool $enabled,
        index_service $indexservice,
    ): void {
        $documentsource = self::load_document_source($sourceid);
        self::require_document_manage_access($coursecontext, $documentsource);

        if (!$enabled) {
            $indexservice->stop($documentsource);
        }

        $documentsource->set_enabled($enabled);
        $documentsource->store();
    }

    /**
     * Create a document source.
     *
     * @param \context_course $coursecontext
     * @param string $scope
     * @param string $name
     * @param string $description
     * @param string $content
     */
    private static function create_document(
        \context_course $coursecontext,
        string $scope,
        string $name,
        string $description,
        string $content,
    ): source {
        $contextid = self::resolve_document_contextid($coursecontext, $scope);

        $documentsource = new source();
        $documentsource->set_contextid($contextid);
        $documentsource->set_sourcetype(source::TYPE_DOCUMENT);
        $documentsource->set_name($name);
        $documentsource->set_description($description);
        $documentsource->set_content($content);
        $documentsource->set_enabled(true);
        $documentsource->set_allowindex(false);
        $documentsource->set_indexstatus(source::INDEXSTATUS_IDLE);
        $documentsource->set_indextaskid(null);
        $documentsource->store();
        return $documentsource;
    }

    /**
     * Update a document source and re-index it when its content changed.
     *
     * @param \context_course $coursecontext
     * @param int $sourceid
     * @param string $name
     * @param string $description
     * @param string $content
     * @param index_service $indexservice
     */
    private static function update_document(
        \context_course $coursecontext,
        int $sourceid,
        string $name,
        string $description,
        string $content,
        index_service $indexservice,
    ): void {
        $documentsource = self::load_document_source($sourceid);
        self::require_document_manage_access($coursecontext, $documentsource);

        $contentchanged = (string)$documentsource->get_content() !== $content;

        $documentsource->set_name($name);
        $documentsource->set_description($description);
        $documentsource->set_content($content);
        $documentsource->store();

        if ($contentchanged && $documentsource->get_allowindex()) {
            $indexservice->start($documentsource);
        }
    }

    /**
     * Delete a document source and its context mappings.
     *
     * @param \context_course $coursecontext
     * @param int $sourceid
     * @param index_service $indexservice
     */
    private static function delete_source(
        \context_course $coursecontext,
        int $sourceid,
        index_service $indexservice,
    ): void {
        global $DB;

        $documentsource = self::load_document_source($sourceid);
        self::require_document_manage_access($coursecontext, $documentsource);

        $indexservice->stop($documentsource);

        $transaction = $DB->start_delegated_transaction();
        $DB->delete_records('local_ai_content_ctx_sources', ['sourceid' => $sourceid]);
        $DB->delete_records('local_ai_content_sources', ['id' => $sourceid]);
        $transaction->allow_commit();
    }

    /**
     * Load one document source by id.
     *
     * @param int $sourceid
     * @return source
     */
    private static function load_document_source(int $sourceid): source {
        if ($sourceid <= 0) {
            throw new \invalid_parameter_exception('Invalid source id.');
        }

        $source = source::get_record(['id' => $sourceid]);
        if ($source === null || $source->get_sourcetype() !== source::TYPE_DOCUMENT) {
            throw new \invalid_parameter_exception('Document source not found.');
        }

        return $source;
    }

    /**
     * Resolve context for new document based on selected scope.
     *
     * @param \context_course $coursecontext
     * @param string $scope
     * @return int
     */
    private static function resolve_document_contextid(\context_course $coursecontext, string $scope): int {
        if ($scope === 'course') {
            return $coursecontext->id;
        }

        if ($scope === 'global') {
            $systemcontext = \context_system::instance();
            require_capability('local/ai_content:managesources', $systemcontext);
            return $systemcontext->id;
        }

        throw new \invalid_parameter_exception('Unsupported document scope: ' . $scope);
    }

    /**
     * Require manage permission for one document source.
     *
     * @param \context_course $coursecontext
     * @param source $source
     */
    private static function require_document_manage_access(\context_course $coursecontext, source $source): void {
        $systemcontext = \context_system::instance();
        if ($source->get_contextid() === $systemcontext->id) {
            require_capability('local/ai_content:managesources', $systemcontext);
            return;
        }

        if ($source->get_contextid() !== $coursecontext->id) {
            throw new \required_capability_exception($coursecontext, 'local/ai_content:managesources', 'nopermissions', '');
        }
    }

    /**
     * Find or create the module source wrapper for a course module.
     *
     * @param \context_course $coursecontext
     * @param int $cmid
     * @return source
     */
    private static function get_or_create_module_source(\context_course $coursecontext, int $cmid): source {
        if ($cmid <= 0) {
            throw new \invalid_parameter_exception('Invalid course module id.');
        }

        $cm = get_coursemodule_from_id('', $cmid, $coursecontext->instanceid, false, MUST_EXIST);
        $modulesource = source::get_record(['cmid' => $cmid, 'sourcetype' => source::TYPE_MODULE]);

        if ($modulesource === null) {
            $modulesource = new source();
            $modulesource->set_contextid($coursecontext->id);
            $modulesource->set_sourcetype(source::TYPE_MODULE);
            $modulesource->set_cmid($cmid);
            $modulesource->set_name((string)$cm->name);
            $modulesource->set_enabled(false);
            $modulesource->set_allowindex(false);
            $modulesource->set_indexstatus(source::INDEXSTATUS_IDLE);
            $modulesource->set_indextaskid(null);
            $modulesource->store();
            return $modulesource;
        }

        $modulesource->set_contextid($coursecontext->id);
        $modulesource->set_name((string)$cm->name);
        $modulesource->store();

        return $modulesource;
    }

    /**
     * Normalize mixed bool-like payload values.
     *
     * @param mixed $value
     * @return bool
     */
    private static function as_bool(mixed $value): bool {
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value)) {
            return $value === 1;
        }
        return (int)clean_param((string)$value, PARAM_BOOL) === 1;
    }

    /**
     * Build a response representation for a document source.
     *
     * @param source $documentsource
     * @return array
     */
    private static function build_document_item_payload(source $documentsource): array {
        return [
            'id' => (int)$documentsource->get_id(),
            'contextId' => (int)$documentsource->get_contextid(),
            'name' => (string)$documentsource->get_name(),
            'description' => (string)$documentsource->get_description(),
            'content' => (string)$documentsource->get_content(),
            'enabled' => (bool)$documentsource->get_enabled(),
            'indexState' => index_state::from_source($documentsource)->to_array(),
        ];
    }

    /**
     * Return a normalized action payload from parsed or raw JSON body.
     *
     * @param ServerRequestInterface $request
     * @return array
     */
    private static function get_action_payload(ServerRequestInterface $request): array {
        $body = $request->getParsedBody();
        if (is_array($body)) {
            return $body;
        }
        if ($body instanceof \stdClass) {
            return (array)$body;
        }

        $rawbody = (string)$request->getBody();
        if ($rawbody === '') {
            return [];
        }

        $decoded = json_decode($rawbody, true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Returns whether this module type has a registered local_ai_content content extractor.
     *
     * @param string $modname
     * @return bool
     */
    private static function is_supported_module_type(string $modname): bool {
        return class_exists('local_ai_content\\contentextractor\\cm_content_' . $modname);
    }

    /**
     * Resolve a localized module type name for display.
     *
     * @param string $modname
     * @return string
     */
    private static function get_module_display_name(string $modname): string {
        if (get_string_manager()->string_exists('modulename', $modname)) {
            return get_string('modulename', $modname);
        }
        return $modname;
    }
}







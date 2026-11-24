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
use core\router\schema\objects\schema_object;
use core\router\schema\objects\scalar_type;
use core\router\schema\response\payload_response;
use core\router\schema\response\content\payload_response_type;
use local_ai_content\local\access_guard;
use local_ai_content\local\source_selection_service;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * REST API routes for context-specific source selection.
 *
 * GET  /api/rest/v2/local_ai_content/contexts/{contextId}/source-selections
 *     Returns selectable sources for the context and the currently saved source selection.
 *
 * PUT /api/rest/v2/local_ai_content/contexts/{contextId}/source-selections
 *     Saves the selected source IDs for the given context.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_selection {
    /**
     * Constructor.
     *
     * @param source_selection_service $selectionservice Service providing the source selection logic.
     * @param access_guard $accessguard Enforces the access rules for the current user.
     */
    public function __construct(
        private readonly source_selection_service $selectionservice,
        private readonly access_guard $accessguard,
    ) {
    }

    /**
     * Retrieve selectable source records and the current selection for a context.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextid The Moodle context ID.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/source-selections',
        method: ['GET'],
        title: 'Get selectable sources and selected source IDs for a context',
        description: 'Returns all selectable sources for this context and the source IDs currently selected for it.',
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
    public function get_source_selection(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId);
        $this->accessguard->require_use_access($context);

        $groupedsources = $this->selectionservice->get_grouped_sources_for_context($contextId);
        $selection = $this->selectionservice->get_selection($contextId);

        return new payload_response(
            payload: [
                'items' => [$groupedsources + $selection + [
                    'canSelect' => has_capability('local/ai_content:selectsources', $context),
                    // Config values, the frontend warns about complete contents above these lengths.
                    'fullContentWarnChars' => (int) get_config('local_ai_content', 'fullcontentwarnchars'),
                    'fullContentTotalWarnChars' => (int) get_config('local_ai_content', 'fullcontenttotalwarnchars'),
                ]],
                'pagination' => [
                    'page' => 1,
                    'pageSize' => 1,
                    'totalItems' => 1,
                ],
            ],
            request: $request,
            response: $response,
        );
    }

    /**
     * Retrieve selectable foreign courses for the source-add flow.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextId The Moodle context ID.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/source-selections/importable-courses',
        method: ['GET'],
        title: 'Get source-selection importable courses',
        description: 'Returns all courses from which the user may attach external sources.',
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
    public function get_importable_courses(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId);
        $this->accessguard->require_use_access($context);
        $this->accessguard->require_capability('local/ai_content:selectsources', $context);

        $courses = $this->selectionservice->get_importable_courses_for_context($contextId);

        return new payload_response(
            payload: [
                'items' => $courses,
                'pagination' => [
                    'page' => 1,
                    'pageSize' => count($courses),
                    'totalItems' => count($courses),
                ],
            ],
            request: $request,
            response: $response,
        );
    }

    /**
     * Retrieve available sources for one selected foreign course.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextId The Moodle context ID.
     * @param int $sourceCourseId The source course ID.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/source-selections/importable-sources',
        method: ['GET'],
        title: 'Get source-selection importable sources',
        description: 'Returns selectable source options for one foreign course.',
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
    public function get_importable_sources(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId);
        $this->accessguard->require_use_access($context);
        $this->accessguard->require_capability('local/ai_content:selectsources', $context);

        // The router has already validated the required query parameter.
        $sourcecourseid = (int)$request->getQueryParams()['sourceCourseId'];

        $sources = $this->selectionservice->get_importable_sources_for_course($contextId, $sourcecourseid);

        return new payload_response(
            payload: [
                'items' => [$sources],
                'pagination' => [
                    'page' => 1,
                    'pageSize' => 1,
                    'totalItems' => 1,
                ],
            ],
            request: $request,
            response: $response,
        );
    }

    /**
     * Save the selected source IDs for a context.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextid The Moodle context ID.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/source-selections',
        method: ['PUT'],
        title: 'Save the source selection for a context',
        description: 'Persists the comma-separated list of source IDs selected for this context and the subset of them whose '
            . 'complete content is used instead of searching them.',
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
                    'selectedSourceIds' => new scalar_type(param::SEQUENCE),
                    'fullSourceIds' => new scalar_type(param::SEQUENCE),
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
    public function save_source_selection(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId);
        $this->accessguard->require_use_access($context);
        $this->accessguard->require_capability('local/ai_content:selectsources', $context);

        $body = (array)$request->getParsedBody();
        $selectedsourceids = clean_param((string)($body['selectedSourceIds'] ?? ''), PARAM_SEQUENCE);
        // Optional, without it all selected sources are searched.
        $fullsourceids = clean_param((string)($body['fullSourceIds'] ?? ''), PARAM_SEQUENCE);

        $selection = $this->selectionservice->save_selection($contextId, $selectedsourceids, $fullsourceids);

        return new payload_response(
            payload: [
                'items' => [$selection + [
                    'success' => true,
                ]],
                'pagination' => [
                    'page' => 1,
                    'pageSize' => 1,
                    'totalItems' => 1,
                ],
            ],
            request: $request,
            response: $response,
        );
    }
}

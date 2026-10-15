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

use core\output\stored_progress_bar;
use core\param;
use core\router\route;
use core\router\schema\objects\scalar_type;
use core\router\schema\objects\schema_object;
use core\router\schema\parameters\path_parameter;
use core\router\schema\response\content\payload_response_type;
use core\router\schema\response\payload_response;
use core\router\schema\response\response as route_response;
use local_ai_content\local\index_service;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * REST API routes for the indexing state of sources.
 *
 * Both routes return the same index state data object so the frontend has exactly one status format.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_index {
    /**
     * Switch indexing on or off for one source.
     *
     * @param ServerRequestInterface $request The request.
     * @param ResponseInterface $response The response.
     * @param int $sourceId The source id.
     * @param index_service $indexservice The indexing service.
     * @return payload_response
     */
    #[route(
        path: '/sources/{sourceId}/index-state',
        method: ['PUT'],
        title: 'Set source indexing state',
        description: 'Queues or cancels indexing of one source and returns the resulting index state.',
        pathtypes: [
            new path_parameter(
                name: 'sourceId',
                type: param::INT,
                description: 'The source ID.',
            ),
        ],
        requestbody: new \core\router\schema\request_body(
            content: new payload_response_type(
                schema: new schema_object([
                    'allowIndex' => new scalar_type(param::BOOL, true),
                ]),
            ),
        ),
        responses: [
            new route_response(statuscode: 200, description: 'OK'),
        ],
    )]
    public function set_index_state(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $sourceId,
        index_service $indexservice,
    ): payload_response {
        $body = (array) $request->getParsedBody();
        $allowindex = (int) clean_param((string) ($body['allowIndex'] ?? ''), PARAM_BOOL) === 1;

        return new payload_response(
            payload: $indexservice->set_allow_index($sourceId, $allowindex)->to_array(),
            request: $request,
            response: $response,
        );
    }

    /**
     * Return the index state of every source visible in the given context.
     *
     * @param ServerRequestInterface $request The request.
     * @param ResponseInterface $response The response.
     * @param int $contextId The active context id.
     * @param index_service $indexservice The indexing service.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/index-states',
        method: ['GET'],
        title: 'Get source index states',
        description: 'Returns the index state of all managed sources of one context.',
        pathtypes: [
            new path_parameter(
                name: 'contextId',
                type: param::INT,
                description: 'The Moodle context ID.',
            ),
        ],
        responses: [
            new route_response(statuscode: 200, description: 'OK'),
        ],
    )]
    public function get_index_states(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
        index_service $indexservice,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId, MUST_EXIST);
        $contextids = sourcemanagement::resolve_managed_contextids($context);

        return new payload_response(
            payload: [
                'items' => $indexservice->get_states_for_contexts($contextids),
                'pollIntervalSeconds' => stored_progress_bar::get_timeout(),
            ],
            request: $request,
            response: $response,
        );
    }
}


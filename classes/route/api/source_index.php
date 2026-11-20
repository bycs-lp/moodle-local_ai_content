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
use core\router\schema\parameters\path_parameter;
use core\router\schema\response\payload_response;
use core\router\schema\response\response as route_response;
use local_ai_content\local\access_guard;
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
     * Constructor.
     *
     * @param index_service $indexservice The indexing service.
     * @param access_guard $accessguard Enforces the access rules for the current user.
     */
    public function __construct(
        /** @var index_service The indexing service. */
        private readonly index_service $indexservice,
        /** @var access_guard Enforces the access rules for the current user. */
        private readonly access_guard $accessguard,
    ) {
    }

    /**
     * Index one source with the embedding model of the current user.
     *
     * @param ServerRequestInterface $request The request.
     * @param ResponseInterface $response The response.
     * @param int $sourceId The source id.
     * @return payload_response
     */
    #[route(
        path: '/sources/{sourceId}/index',
        method: ['POST'],
        title: 'Index source',
        description: 'Queues the indexing of one source with the embedding model of the current user and returns the '
            . 'resulting index state.',
        pathtypes: [
            new path_parameter(
                name: 'sourceId',
                type: param::INT,
                description: 'The source ID.',
            ),
        ],
        responses: [
            new route_response(statuscode: 200, description: 'OK'),
        ],
    )]
    public function index_source(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $sourceId,
    ): payload_response {
        return new payload_response(
            payload: $this->indexservice->start_by_id($sourceId)->to_array(),
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
    ): payload_response {
        $context = \context_helper::instance_by_id($contextId, MUST_EXIST);
        $contextids = $this->accessguard->get_managed_contextids($context);

        return new payload_response(
            payload: [
                'items' => $this->indexservice->get_states_for_contexts($contextids),
                'pollIntervalSeconds' => stored_progress_bar::get_timeout(),
            ],
            request: $request,
            response: $response,
        );
    }
}


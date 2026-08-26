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
use core\router\schema\response\payload_response;
use local_ai_content\local\source_vector_status_service;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * REST API route for source vector-store status checks.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_vector_status {
    /**
     * Return vector-store status for one source.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $sourceId Source id.
     * @param source_vector_status_service $vectorstatusservice Vector-status service.
     * @return payload_response
     */
    #[route(
        path: '/sources/{sourceId}/vector-status',
        method: ['GET'],
        title: 'Get source vector status',
        description: 'Returns whether one source has vector-store entries and resets stale indexed state when empty.',
        pathtypes: [
            new \core\router\schema\parameters\path_parameter(
                name: 'sourceId',
                type: param::INT,
                description: 'The source ID.',
            ),
        ],
        responses: [
            new \core\router\schema\response\response(
                statuscode: 200,
                description: 'OK',
            ),
        ],
    )]
    public function get_source_vector_status(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $sourceId,
        source_vector_status_service $vectorstatusservice,
    ): payload_response {
        return new payload_response(
            payload: $vectorstatusservice->get_source_vector_status_payload($sourceId),
            request: $request,
            response: $response,
        );
    }
}




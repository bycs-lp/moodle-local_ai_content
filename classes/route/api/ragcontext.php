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
use core\router\schema\objects\scalar_type;
use core\router\schema\response\payload_response;
use core\router\schema\response\content\payload_response_type;
use local_ai_content\local\rag_context_utils;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * REST API routes for source selection.
 *
 * GET  /api/rest/v2/local_ai_content/ragcontext/{contextid}
 *     Returns the available indexable sources and the currently saved selection.
 *
 * POST /api/rest/v2/local_ai_content/ragcontext/{contextid}
 *     Saves the selected sourceids for the given context.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class ragcontext {

    /**
     * Retrieve available source records and the current selection for a context.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextid The Moodle context ID.
     * @return payload_response
     */
    #[route(
        path: '/ragcontext/{contextid}',
        method: ['GET'],
        title: 'Get available and selected source IDs for a context',
        description: 'Returns all indexable sources in the course context and the currently selected source IDs.',
        pathtypes: [
            new \core\router\schema\parameters\path_parameter(
                name: 'contextid',
                type: param::INT,
                description: 'The Moodle context ID.',
            ),
        ],
    )]
    public function get_ragcontext(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextid,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextid);
        self::require_login_and_access($context);

        $available = rag_context_utils::get_available_sources_for_context($contextid);
        $selected = rag_context_utils::get_selected_sourceids($contextid) ?? '';

        return new payload_response(
            payload: [
                'available' => $available,
                'selected'  => $selected,
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
        path: '/ragcontext/{contextid}',
        method: ['POST'],
        title: 'Save selected source IDs for a context',
        description: 'Persists the comma-separated list of selected local_ai_content_sources record IDs for a context.',
        pathtypes: [
            new \core\router\schema\parameters\path_parameter(
                name: 'contextid',
                type: param::INT,
                description: 'The Moodle context ID.',
            ),
        ],
        requestbody: new \core\router\schema\request_body(
            content: new payload_response_type(
                schema: [
                    'sourceids' => new scalar_type(param::SEQUENCE),
                ],
            ),
        ),
    )]
    public function save_ragcontext(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextid,
    ): payload_response {
        $context = \context_helper::instance_by_id($contextid);
        self::require_login_and_access($context);

        $body = $request->getParsedBody();
        $sourceids = clean_param($body['sourceids'] ?? '', PARAM_SEQUENCE);

        rag_context_utils::save_selected_sourceids($contextid, $sourceids);

        return new payload_response(
            payload: ['success' => true, 'sourceids' => $sourceids],
            request: $request,
            response: $response,
        );
    }

    /**
     * Enforce login and basic view capability for a context.
     *
     * @param \context $context
     */
    private static function require_login_and_access(\context $context): void {
        require_login();
        require_capability('moodle/course:view', $context->get_course_context());
    }
}

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
use core\router\schema\objects\array_of_things;
use core\router\schema\objects\scalar_type;
use core\router\schema\objects\schema_object;
use core\router\schema\response\content\payload_response_type;
use core\router\schema\response\payload_response;
use local_ai_content\local\access_guard;
use local_ai_content\local\source_management_service;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * REST API routes for source management.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_management {
    /**
     * Constructor.
     *
     * @param access_guard $accessguard Enforces the access rules for the current user.
     * @param source_management_service $managementservice Service behind the source management.
     */
    public function __construct(
        /** @var access_guard Enforces the access rules for the current user. */
        private readonly access_guard $accessguard,
        /** @var source_management_service Service behind the source management. */
        private readonly source_management_service $managementservice,
    ) {
    }

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
        $coursecontext = $this->accessguard->require_manage_access(\context_helper::instance_by_id($contextId, MUST_EXIST));

        return new payload_response(
            payload: $this->build_payload($coursecontext),
            request: $request,
            response: $response,
        );
    }

    /**
     * Share module and document sources with AI or stop sharing them.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $contextId The active context id.
     * @return payload_response
     */
    #[route(
        path: '/contexts/{contextId}/sources',
        method: ['PATCH'],
        title: 'Update sources',
        description: 'Shares the given module and document sources with AI or stops sharing them. Either all or none of '
            . 'them are changed.',
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
                    'cmIds' => new array_of_things(thingtype: param::INT),
                    'documentIds' => new array_of_things(thingtype: param::INT),
                    'enabled' => new scalar_type(param::BOOL, true),
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
    public function update_sources(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $contextId,
    ): payload_response {
        $coursecontext = $this->accessguard->require_manage_access(\context_helper::instance_by_id($contextId, MUST_EXIST));
        $body = (array)$request->getParsedBody();
        if (!array_key_exists('enabled', $body)) {
            throw new \invalid_parameter_exception('Missing field enabled.');
        }

        // Both lists are optional, e.g. only documents are changed.
        $this->managementservice->set_sources_enabled(
            $coursecontext,
            array_map('intval', $body['cmIds'] ?? []),
            array_map('intval', $body['documentIds'] ?? []),
            self::as_bool($body['enabled']),
        );

        return new payload_response(
            payload: $this->build_payload($coursecontext),
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
        $coursecontext = $this->accessguard->require_manage_access(\context_helper::instance_by_id($contextId, MUST_EXIST));
        $body = (array)$request->getParsedBody();

        $documentsource = $this->managementservice->create_document(
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
                'item' => $this->managementservice->get_document_item($documentsource),
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
        description: 'Updates the name, description and/or content of one document source.',
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
    ): payload_response {
        $coursecontext = $this->accessguard->require_manage_access(\context_helper::instance_by_id($contextId, MUST_EXIST));
        $body = (array)$request->getParsedBody();

        if (array_key_exists('name', $body) || array_key_exists('description', $body) || array_key_exists('content', $body)) {
            // Fields missing in the request body are kept.
            $this->managementservice->update_document(
                $coursecontext,
                $sourceId,
                array_key_exists('name', $body) ? clean_param((string)$body['name'], PARAM_TEXT) : null,
                array_key_exists('description', $body) ? clean_param((string)$body['description'], PARAM_RAW) : null,
                array_key_exists('content', $body) ? clean_param((string)$body['content'], PARAM_RAW) : null,
            );
        }

        return new payload_response(
            payload: $this->build_payload($coursecontext),
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
    ): payload_response {
        $coursecontext = $this->accessguard->require_manage_access(\context_helper::instance_by_id($contextId, MUST_EXIST));

        $this->managementservice->delete_document($coursecontext, $sourceId);

        return new payload_response(
            payload: $this->build_payload($coursecontext),
            request: $request,
            response: $response,
        );
    }

    /**
     * Build the response payload consumed by the management React app.
     *
     * @param \context_course $coursecontext The context of the course whose sources are managed.
     * @return array The overview of the managed sources.
     */
    private function build_payload(\context_course $coursecontext): array {
        return $this->managementservice->get_overview($coursecontext) + [
            'pagination' => [
                'page' => 1,
                'pageSize' => 1,
                'totalItems' => 1,
            ],
        ];
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
}


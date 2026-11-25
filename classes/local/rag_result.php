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
 * DTO holding retrieved RAG context, the complete contents of sources, source references and the selected sources which
 * could not be used.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class rag_result {
    /** @var string Reason for an unusable source: it is being indexed with the embedding model of the user right now. */
    public const UNAVAILABLE_INDEXING = 'indexing';

    /** @var string Reason for an unusable source: it is not indexed with the embedding model of the user. */
    public const UNAVAILABLE_OTHERMODEL = 'othermodel';

    /** @var string Reason for an unusable source selected with its full content: its content could not be read. */
    public const UNAVAILABLE_NOCONTENT = 'nocontent';

    /** @var string Retrieved text chunks used as grounding context. */
    protected string $retrievedtext;

    /** @var string Complete contents of the sources selected with their full content. */
    protected string $includedtext;

    /** @var source_reference[] Sources ordered by relevance. */
    protected array $sources;

    /** @var array[] Selected sources which could not be used, each with the keys sourceid, name and reason. */
    protected array $unavailablesources;

    /**
     * Constructor.
     *
     * @param string $retrievedtext Retrieved text chunks.
     * @param source_reference[] $sources Source references.
     * @param array[] $unavailablesources Selected sources which could not be used, each with the keys sourceid (int),
     *  name (string) and reason (one of the UNAVAILABLE_* constants).
     * @param string $includedtext Complete contents of the sources selected with their full content.
     */
    public function __construct(string $retrievedtext, array $sources = [], array $unavailablesources = [],
            string $includedtext = '') {
        $this->retrievedtext = $retrievedtext;
        $this->sources = $sources;
        $this->unavailablesources = $unavailablesources;
        $this->includedtext = $includedtext;
    }

    /**
     * Get the retrieved text.
     *
     * @return string
     */
    public function get_retrieved_text(): string {
        return $this->retrievedtext;
    }

    /**
     * Get the complete contents of the sources selected with their full content.
     *
     * @return string The tagged documents, empty if no such source has been used.
     */
    public function get_included_text(): string {
        return $this->includedtext;
    }

    /**
     * Get source references.
     *
     * @return source_reference[]
     */
    public function get_sources(): array {
        return $this->sources;
    }

    /**
     * Whether any source references exist.
     *
     * @return bool
     */
    public function has_sources(): bool {
        return !empty($this->sources);
    }

    /**
     * Get the selected sources which could not be used.
     *
     * @return array[] Each with the keys sourceid, name and reason.
     */
    public function get_unavailable_sources(): array {
        return $this->unavailablesources;
    }

    /**
     * Export to API-safe array.
     *
     * The array is the result data of the RAG context (see {@see rag_manager::add_rag_context()}). It is stored in the
     * request log with the request options (key 'contextdata') and used by the calling component to show the sources next
     * to the response, also when the conversation is loaded again later.
     *
     * Only the metadata of the sources is exported, never their content: neither the retrieved excerpts
     * ({@see get_retrieved_text()}) nor the complete contents ({@see get_included_text()}). Both are added as prompt
     * context and therefore already end up in the request log as part of the request that has been sent to the AI tool
     * (system message of the conversation context or prompt text). Exporting them here as well would only store a second
     * copy of possibly very long texts with every request.
     *
     * @return array{sources: array[], unavailableSources: array[]} the references of the sources used (see
     *  {@see source_reference::to_array()}) and the selected sources which could not be used, each with the keys sourceId,
     *  name and reason
     */
    public function to_array(): array {
        return [
            'sources' => array_map(static fn(source_reference $source): array => $source->to_array(), $this->sources),
            'unavailableSources' => array_map(static fn(array $source): array => [
                'sourceId' => $source['sourceid'],
                'name' => $source['name'],
                'reason' => $source['reason'],
            ], $this->unavailablesources),
        ];
    }
}

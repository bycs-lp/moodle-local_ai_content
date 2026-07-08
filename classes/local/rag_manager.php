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

use local_ai_manager\local\connector_factory;
use local_ai_manager\manager;

/**
 * Manager encapsulating the retrieval augmented generation (RAG) retrieval logic.
 *
 * Given a user prompt, this class embeds the user prompt using the "embedding" purpose, performs a similarity search
 * against the tenant's primary vector store and assembles the matching content into a single string that can be
 * injected into the system prompt of a chat request. The vector store returns the matches as
 * {@see enriched_vector} objects.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class rag_manager {
    /** @var int Default number of nearest neighbours to include in the assembled RAG content. */
    private const DEFAULT_TOPK = 5;

    /**
     * Retrieves the RAG content for a given user prompt.
     *
     * Embeds the user prompt via the "embedding" purpose, performs a vector search in the tenant's primary vector
     * store filtered to the given source IDs, and assembles the matching chunks into a single string.
     *
     * @param string $userprompt the user prompt to embed and search for
     * @param int[] $sourceids list of local_ai_content_sources record IDs to filter by; must be non-empty
     * @param string $component the component from which the (embedding) request is being performed
     * @param int $contextid the context id from which the (embedding) request is being performed
     * @param int $topk the maximum number of chunks to include in the assembled RAG content
     * @return string the assembled RAG content, or an empty string if no content could be retrieved
     */
    public function get_rag_content(
        string $userprompt,
        array $sourceids,
        string $component,
        int $contextid,
        int $topk = self::DEFAULT_TOPK
    ): string {
        $connectorfactory = \core\di::get(connector_factory::class);
        $vecstore = $connectorfactory->get_primary_vecstore();
        if (is_null($vecstore)) {
            return '';
        }
        if ($vecstore->get_collection() === '') {
            return '';
        }

        $sourceids = array_values(array_unique(array_filter(array_map('intval', $sourceids))));
        if (empty($sourceids)) {
            return '';
        }

        // Embed the user prompt using the embedding purpose.
        $embeddingmanager = new manager('embedding');
        $response = $embeddingmanager->perform_request($userprompt, $component, $contextid);
        if ($response->get_code() !== 200) {
            return '';
        }
        $embedding = json_decode($response->get_content(), true);
        if (!is_array($embedding) || empty($embedding)) {
            return '';
        }

        // Filter the vector store directly by source ID — no contextid indirection needed.
        $filters = ['sourceid' => $sourceids];

        // Perform the vector search and extract matches from the structured vecstore response.
        $queryresponse = $vecstore->query($embedding, $topk, $filters);
        if ($queryresponse->get_code() !== 200 || is_null($queryresponse->get_queryresponse())) {
            return '';
        }
        $matches = $queryresponse->get_queryresponse()->get_matches();
        if (empty($matches)) {
            return '';
        }
        // Assemble the resulting content string from the matches' textual content.
        $chunks = [];
        foreach ($matches as $match) {
            $content = $match->get_content();
            if ($content !== '') {
                $chunks[] = $content;
            }
        }
        return implode("\n\n---\n\n", $chunks);
    }
}


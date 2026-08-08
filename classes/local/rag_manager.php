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
use local_ai_manager\base_vecstore;
use local_ai_manager\local\connector_factory;
use local_ai_manager\local\vecstore_factory;
use local_ai_manager\manager;

/**
 * Manager encapsulating the retrieval augmented generation (RAG) retrieval logic.
 *
 * Given a user prompt, this class embeds the user prompt using the "embedding" purpose, performs a similarity search
 * against the relevant vector store(s) and assembles the matching content into a single string that can be injected
 * into the system prompt of a chat request. The vector store returns the matches as {@see enriched_vector} objects.
 *
 * Retrieval distinguishes two kinds of sources:
 *  - Moodle sources (module/document) are filtered by their source id (the user pre-selection), after the
 *    selection has been restricted to the sources the requesting user may access (see {@see source_access}).
 *  - External sources are filtered by their own stored payload filter (see {@see source::get_externalfilter()}),
 *    as their vectors are managed outside of Moodle.
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
     * Embeds the user prompt via the "embedding" purpose, performs vector searches restricted to the given source
     * IDs (after removing those the user may not access) and assembles the matching chunks into a single string.
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

        // Load the selected source records and split them into Moodle and external sources.
        $sources = source::get_records_by_ids($sourceids);
        if (empty($sources)) {
            return '';
        }

        // Security: restrict the selection to the sources the requesting user is actually allowed to retrieve from.
        $accessiblesourceids = source_access::filter_accessible_sourceids(array_keys($sources));
        $sources = array_intersect_key($sources, array_flip($accessiblesourceids));
        if (empty($sources)) {
            return '';
        }

        $matches = [];

        // Moodle sources (module/document): grouped by their target vector store instance.
        $moodlesourcesbyvecstore = [];
        foreach ($sources as $source) {
            if ($source->get_sourcetype() === source::TYPE_EXTERNAL) {
                continue;
            }
            $moodlesourcesbyvecstore[(int) $source->get_vecstoreid()][] = $source->get_id();
        }
        foreach ($moodlesourcesbyvecstore as $vecstoreid => $groupsourceids) {
            $vecstore = $this->resolve_vecstore($vecstoreid ?: null);
            if ($vecstore === null || $vecstore->get_collection() === '') {
                continue;
            }
            $filters = ['sourceid' => $groupsourceids];
            $matches = array_merge($matches, $this->query_matches($vecstore, $embedding, $topk, $filters));
        }

        // External sources: each queried with its own stored payload filter.
        foreach ($sources as $source) {
            if ($source->get_sourcetype() !== source::TYPE_EXTERNAL) {
                continue;
            }
            $vecstore = $this->resolve_vecstore($source->get_vecstoreid());
            if ($vecstore === null || $vecstore->get_collection() === '') {
                continue;
            }
            $filters = [];
            $externalfilter = $source->get_externalfilter();
            if (!empty($externalfilter)) {
                $decoded = json_decode($externalfilter, true);
                if (is_array($decoded)) {
                    $filters = $decoded;
                }
            }
            $matches = array_merge($matches, $this->query_matches($vecstore, $embedding, $topk, $filters));
        }

        if (empty($matches)) {
            return '';
        }

        // Assemble the resulting content string, capped to topk chunks, followed by the collected source citations.
        $sourcesbyid = $this->load_sources_by_id($matches, $sources);
        $chunks = [];
        $references = [];
        foreach ($matches as $match) {
            $content = $match->get_content();
            if ($content === '') {
                continue;
            }
            $chunks[] = $content;
            $reference = $this->build_reference($match, $sourcesbyid);
            if ($reference !== '') {
                $references[$reference] = $reference;
            }
            if (count($chunks) >= $topk) {
                break;
            }
        }
        if (empty($chunks)) {
            return '';
        }

        $result = implode("\n\n---\n\n", $chunks);
        if (!empty($references)) {
            $result .= "\n\n===\n\n" . get_string('ragsourcesheading', 'local_ai_content') . "\n"
                . implode("\n", array_values($references));
        }
        return $result;
    }

    /**
     * Loads the source records referenced by the given matches, reusing the already loaded selection.
     *
     * @param enriched_vector[] $matches the query matches
     * @param source[] $selectedsources the already loaded selected sources (indexed by record id)
     * @return source[] the referenced sources indexed by record id
     */
    protected function load_sources_by_id(array $matches, array $selectedsources): array {
        $sourcesbyid = [];
        foreach ($selectedsources as $source) {
            $sourcesbyid[$source->get_id()] = $source;
        }
        $missing = [];
        foreach ($matches as $match) {
            $sourceid = $match->get_sourceid();
            if ($sourceid > 0 && !isset($sourcesbyid[$sourceid])) {
                $missing[$sourceid] = $sourceid;
            }
        }
        if (!empty($missing)) {
            $sourcesbyid += source::get_records_by_ids(array_values($missing));
        }
        return $sourcesbyid;
    }

    /**
     * Builds a human-readable citation reference for a single match.
     *
     * Combines the source-level citation (resolved from the match's source id) with the vector-level locator and
     * deep link carried on the match itself.
     *
     * @param enriched_vector $match the query match
     * @param source[] $sourcesbyid the referenced sources indexed by record id
     * @return string the citation reference line, or an empty string if no citation data is available
     */
    protected function build_reference(enriched_vector $match, array $sourcesbyid): string {
        $source = $sourcesbyid[$match->get_sourceid()] ?? null;
        $citation = $source !== null ? $source->get_effective_citation() : source_citation::create();

        $parts = [];
        if ($citation->get_title() !== '') {
            $parts[] = $citation->get_title();
        }
        if ($citation->get_author() !== '') {
            $parts[] = $citation->get_author();
        }
        if ($citation->get_date() !== '') {
            $parts[] = $citation->get_date();
        }
        // A per-chunk deep link takes precedence over the source-level canonical URL.
        $url = $match->get_url() !== '' ? $match->get_url() : $citation->get_url();
        if ($url !== '') {
            $parts[] = $url;
        }
        if ($match->get_locator() !== '') {
            $parts[] = $match->get_locator();
        }
        if ($citation->get_license() !== '') {
            $parts[] = $citation->get_license();
        }
        if (empty($parts)) {
            return '';
        }
        return '- ' . implode(', ', $parts);
    }

    /**
     * Resolves the vector store driver for a given instance id, falling back to the tenant's primary.
     *
     * @param ?int $vecstoreid The vector store instance id, or null for the primary.
     * @return ?base_vecstore The vector store driver, or null if none is available.
     */
    protected function resolve_vecstore(?int $vecstoreid): ?base_vecstore {
        if ($vecstoreid) {
            $vecstorefactory = \core\di::get(vecstore_factory::class);
            if ($vecstorefactory->instance_exists($vecstoreid)) {
                return $vecstorefactory->get_vecstore_by_id($vecstoreid);
            }
        }
        return \core\di::get(connector_factory::class)->get_primary_vecstore();
    }

    /**
     * Runs a similarity search and returns the matched enriched vectors.
     *
     * @param base_vecstore $vecstore The vector store driver to query.
     * @param array $embedding The query embedding vector.
     * @param int $topk The maximum number of neighbours to return.
     * @param array $filters The payload filters to apply.
     * @return enriched_vector[] The matched enriched vectors.
     */
    protected function query_matches(base_vecstore $vecstore, array $embedding, int $topk, array $filters): array {
        $queryresponse = $vecstore->query($embedding, $topk, $filters);
        if ($queryresponse->get_code() !== 200 || is_null($queryresponse->get_queryresponse())) {
            return [];
        }
        return $queryresponse->get_queryresponse()->get_matches();
    }
}

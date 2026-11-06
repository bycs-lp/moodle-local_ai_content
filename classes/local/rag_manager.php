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

use local_ai_content\context_source;
use local_ai_content\source;
use local_ai_manager\base_vecstore;
use local_ai_manager\local\vecstore_factory;
use local_ai_manager\local\vecstore_response;
use local_ai_manager\manager;

/**
 * Manager encapsulating the retrieval augmented generation (RAG) retrieval logic.
 *
 * Given a user prompt, this class embeds the user prompt using the "embedding" purpose, performs a similarity search
 * against the relevant vector store(s) and assembles the matching content into a structured result object that can be injected
 * into the system prompt of a chat request. The vector store returns the matches as {@see enriched_vector} objects.
 *
 * Vectors of different embedding models cannot be compared, so only sources indexed with the embedding model of the requesting
 * user can be searched. The other selected sources are reported as unavailable in the result.
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
    private const DEFAULT_TOPK = 10;

    /**
     * Constructor.
     *
     * @param source_selection_utils $sourceselectionutils Service deciding which sources are selectable.
     * @param embedding_model_resolver $modelresolver Resolver of the embedding model of the current user.
     */
    public function __construct(
        private readonly source_selection_utils $sourceselectionutils,
        private readonly embedding_model_resolver $modelresolver,
    ) {
    }

    /**
     * Retrieves the RAG content for a given user prompt.
     *
     * Embeds the user prompt via the "embedding" purpose, performs vector searches restricted to the given source
     * IDs and assembles the matching chunks into a single string. Only source IDs stored as selection for the
     * context are used, and of those only selectable sources the user may access. Selected sources which are not indexed
     * with the embedding model of the user are reported as unavailable in the result.
     *
     * @param string $userprompt the user prompt to embed and search for
     * @param int[] $sourceids list of local_ai_content_sources record IDs to filter by (client input)
     * @param string $component the component from which the (embedding) request is being performed
     * @param int $contextid the context id from which the (embedding) request is being performed and whose stored
     *  source selection applies
     * @param int $topk the maximum number of chunks to include in the assembled RAG content
     * @return rag_result the assembled RAG result
     * @throws \moodle_exception if the selected sources cannot be searched, for example because the embedding request or a
     *  vector store query failed
     */
    public function get_rag_content(
        string $userprompt,
        array $sourceids,
        string $component,
        int $contextid,
        int $topk = self::DEFAULT_TOPK
    ): rag_result {
        // Security: the source ids come from the client, so only those stored as selection for the context are used.
        $sourceids = array_intersect(
            array_map('intval', $sourceids),
            context_source::get_sourceids_for_context($contextid)
        );
        if (empty($sourceids)) {
            return new rag_result('');
        }

        // Load the selected source records, keeping only selectable ones (enabled and with retrievable vectors).
        $sources = array_filter(
            source::get_records_by_ids($sourceids),
            fn(source $source): bool => $this->sourceselectionutils->is_selectable($source)
        );
        if (empty($sources)) {
            return new rag_result('');
        }

        // Security: restrict the selection to the sources the requesting user is actually allowed to retrieve from.
        $accessiblesourceids = source_access::filter_accessible_sourceids(array_keys($sources));
        $sources = array_intersect_key($sources, array_flip($accessiblesourceids));
        if (empty($sources)) {
            return new rag_result('');
        }

        // Only sources indexed with the embedding model of the user can be searched.
        $model = $this->modelresolver->get_current_model();
        [$sources, $unavailablesources] = $this->split_by_usability($sources, $model);
        if (empty($sources)) {
            return new rag_result('', [], $unavailablesources);
        }

        // Embed the user prompt using the embedding purpose.
        $embeddingmanager = new manager('embedding');
        $response = $embeddingmanager->perform_request($userprompt, $component, $contextid);
        if ($response->get_code() !== 200) {
            $errormessage = trim($response->get_errormessage());
            throw new \moodle_exception(
                'error_ragembeddingfailed',
                'local_ai_content',
                '',
                $errormessage !== '' ? $errormessage : 'Embedding request failed with code ' . $response->get_code() . '.',
                $response->get_debuginfo()
            );
        }
        $embedding = json_decode($response->get_content(), true);
        if (!is_array($embedding) || empty($embedding)) {
            throw new \moodle_exception('error_ragembeddinginvalid', 'local_ai_content', '', null, $response->get_content());
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
            $vecstore = $this->resolve_vecstore($vecstoreid);
            if ($vecstore === null) {
                continue;
            }
            $filters = ['sourceid' => $groupsourceids];
            $queryresponse = $vecstore->query($model, $embedding, $topk, $filters);
            $matches = array_merge($matches, $this->get_matches($queryresponse));
        }

        // External sources: each queried in its own collection with its own stored payload filter.
        foreach ($sources as $source) {
            if ($source->get_sourcetype() !== source::TYPE_EXTERNAL) {
                continue;
            }
            $vecstore = $this->resolve_vecstore((int) $source->get_vecstoreid());
            if ($vecstore === null) {
                continue;
            }
            $filters = [];
            $externalfilter = $source->get_externalfilter();
            if (!empty($externalfilter)) {
                $filters = json_decode($externalfilter, true, flags: JSON_THROW_ON_ERROR);
            }
            $queryresponse = $vecstore->query_collection((string) $source->get_externalcollection(), $embedding, $topk, $filters);
            $matches = array_merge($matches, $this->get_matches($queryresponse));
        }

        if (empty($matches)) {
            return new rag_result('', [], $unavailablesources);
        }

        // Keep backend relevance order and cap to topk chunks.
        $sourcesbyid = $this->load_sources_by_id($matches, $sources);
        $chunks = [];
        $references = [];
        foreach ($matches as $match) {
            $content = $match->get_content();
            if ($content === '') {
                continue;
            }
            $reference = $this->build_source_reference($match, $sourcesbyid);
            $chunks[] = $this->format_excerpt(
                count($chunks) + 1,
                $content,
                $reference?->get_title() ?? '',
                $this->format_location($match, $sourcesbyid[$match->get_sourceid()] ?? null)
            );
            if ($reference !== null) {
                $referencekey = implode('|', [
                    $reference->get_sourceid(),
                    $reference->get_title(),
                    $reference->get_url(),
                    $reference->get_locator(),
                ]);
                if (!array_key_exists($referencekey, $references)) {
                    $references[$referencekey] = $reference;
                }
            }
            if (count($chunks) >= $topk) {
                break;
            }
        }
        if (empty($chunks)) {
            return new rag_result('', [], $unavailablesources);
        }

        return new rag_result(implode("\n\n", $chunks), array_values($references), $unavailablesources);
    }

    /**
     * Wraps a retrieved chunk into a tagged excerpt block for the prompt.
     *
     * Privacy: only the source title and the location inside the source are added as metadata. Fields that could contain
     * personal data (author, publisher, date, license, urls, ids, user data) must never be added here.
     *
     * @param int $index the 1-based position of the excerpt in the relevance order
     * @param string $content the chunk text
     * @param string $title the source title, empty if unknown
     * @param string $location the human-readable location inside the source, empty if unknown
     * @return string the excerpt block
     */
    protected function format_excerpt(int $index, string $content, string $title, string $location): string {
        $attributes = 'index="' . $index . '"';
        if ($title !== '') {
            $attributes .= ' source="' . self::clean_excerpt_attribute($title) . '"';
        }
        if ($location !== '') {
            $attributes .= ' location="' . self::clean_excerpt_attribute($location) . '"';
        }
        return '<excerpt ' . $attributes . ">\n" . self::neutralize_excerpt_tags(trim($content)) . "\n</excerpt>";
    }

    /**
     * Builds the human-readable location of a chunk inside its source from the locator and the locator type.
     *
     * @param enriched_vector $match the query match
     * @param ?source $source the source of the match, null if it does not exist anymore
     * @return string the location, empty if the chunk carries no usable locator
     */
    protected function format_location(enriched_vector $match, ?source $source): string {
        $locator = trim($match->get_locator());
        if ($locator === '') {
            return '';
        }
        return match ($source?->get_citation()?->get_locatortype() ?? '') {
            source_citation::LOCATOR_PAGE => 'page ' . $locator,
            source_citation::LOCATOR_SECTION => 'section ' . $locator,
            source_citation::LOCATOR_TIMESTAMP => 'timestamp ' . $locator,
            // A character offset does not help the model to understand the context.
            source_citation::LOCATOR_CHAR => '',
            default => $locator,
        };
    }

    /**
     * Makes a value safe to be used as attribute value of an excerpt tag.
     *
     * @param string $value the raw value
     * @return string the value on a single line without double quotes
     */
    private static function clean_excerpt_attribute(string $value): string {
        return self::neutralize_excerpt_tags(trim(str_replace('"', "'", preg_replace('/\s+/u', ' ', $value))));
    }

    /**
     * Neutralizes the tags framing the excerpts inside retrieved text.
     *
     * Retrieved content is untrusted: without this, it could close the excerpt block and place text outside of it, which
     * the model would no longer treat as reference material (prompt injection).
     *
     * @param string $text the untrusted text
     * @return string the text in which opening and closing excerpt tags cannot be recognized as such anymore
     */
    private static function neutralize_excerpt_tags(string $text): string {
        return preg_replace('#<(\s*/?\s*)(excerpt|retrieved_excerpts)\b#iu', '‹$1$2', $text);
    }

    /**
     * Splits the selected sources into the ones searchable with the embedding model of the user and the unavailable ones.
     *
     * @param source[] $sources the selected sources indexed by record id
     * @param ?string $model the embedding model of the user, null if the user has none
     * @return array{0: source[], 1: array[]} the searchable sources indexed by record id and the unavailable sources in the
     *  format of {@see rag_result::get_unavailable_sources()}
     */
    protected function split_by_usability(array $sources, ?string $model): array {
        $indexes = model_index::get_for_sources(array_keys($sources));
        $usable = [];
        $unavailable = [];
        foreach ($sources as $sourceid => $source) {
            $reason = rag_result::UNAVAILABLE_OTHERMODEL;
            if ($source->get_sourcetype() === source::TYPE_EXTERNAL) {
                if ($model !== null && $source->get_externalmodel() === $model) {
                    $reason = null;
                }
            } else {
                $index = $model === null ? null : ($indexes[$sourceid][$model] ?? null);
                if ($index?->is_searchable()) {
                    $reason = null;
                } else if ($index?->is_active()) {
                    $reason = rag_result::UNAVAILABLE_INDEXING;
                }
            }

            if ($reason === null) {
                $usable[$sourceid] = $source;
                continue;
            }
            $unavailable[] = [
                'sourceid' => $source->get_id(),
                'name' => $source->get_effective_citation()->get_title(),
                'reason' => $reason,
            ];
        }
        return [$usable, $unavailable];
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
     * Builds a source reference object for a single match.
     *
     * Combines the source-level citation (resolved from the match's source id) with the vector-level locator and
     * deep link carried on the match itself.
     *
     * @param enriched_vector $match the query match
     * @param source[] $sourcesbyid the referenced sources indexed by record id
     * @return ?rag_source source reference or null when no usable title exists
     */
    protected function build_source_reference(enriched_vector $match, array $sourcesbyid): ?rag_source {
        $source = $sourcesbyid[$match->get_sourceid()] ?? null;
        $citation = $source !== null ? $source->get_effective_citation() : source_citation::create();

        $title = trim((string)$citation->get_title());
        if ($title === '' && $source !== null && (string)$source->get_name() !== '') {
            $title = (string)$source->get_name();
        }
        if ($title === '') {
            return null;
        }

        // A per-chunk deep link takes precedence over the source-level canonical URL.
        $url = $match->get_url() !== '' ? $match->get_url() : $citation->get_url();
        return new rag_source($match->get_sourceid(), $title, $url, $match->get_locator());
    }

    /**
     * Resolves the vector store driver of the vector store instance a source is bound to.
     *
     * Sources not bound to a vector store or bound to a removed one have no vectors to query.
     *
     * @param int $vecstoreid The vector store instance id, 0 if the source is not bound to one.
     * @return ?base_vecstore The vector store driver, or null if the instance does not exist.
     */
    protected function resolve_vecstore(int $vecstoreid): ?base_vecstore {
        // Sources that have not been indexed yet are not bound to a vector store. A deleted vector store instance
        // unbinds its sources beforehand, so a bound instance always exists.
        if ($vecstoreid === 0) {
            return null;
        }
        return \core\di::get(vecstore_factory::class)->get_vecstore_by_id($vecstoreid);
    }

    /**
     * Returns the matched enriched vectors of a similarity search.
     *
     * @param vecstore_response $queryresponse The response of the similarity search.
     * @return enriched_vector[] The matched enriched vectors.
     * @throws \moodle_exception If the similarity search failed.
     */
    protected function get_matches(vecstore_response $queryresponse): array {
        if ($queryresponse->get_code() !== 200) {
            throw new \moodle_exception(
                'error_ragqueryfailed',
                'local_ai_content',
                '',
                null,
                trim($queryresponse->get_errormessage() . "\n" . $queryresponse->get_debuginfo())
            );
        }
        return $queryresponse->get_queryresponse()->get_matches();
    }
}

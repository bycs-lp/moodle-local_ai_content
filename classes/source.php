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

namespace local_ai_content;

use core_course\modinfo;
use local_ai_content\local\source_citation;

/**
 * Wrapper class for local_ai_content_sources records.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source {
    /** @var string Source type for Moodle activities. */
    public const TYPE_MODULE = 'module';

    /** @var string Source type for manually entered documents. */
    public const TYPE_DOCUMENT = 'document';

    /** @var string Source type for external content already present in a vector store. */
    public const TYPE_EXTERNAL = 'external';

    /** @var ?\stdClass Raw DB record. */
    protected ?\stdClass $record = null;

    /** @var int Record id. */
    protected int $id = 0;

    /** @var int Context id this source belongs to. */
    protected int $contextid = 0;

    /** @var string Source type identifier. */
    protected string $sourcetype = self::TYPE_MODULE;

    /** @var ?int Related course module id for module sources. */
    protected ?int $cmid = null;

    /** @var ?string Optional source display name. */
    protected ?string $name = null;

    /** @var ?string Optional source description. */
    protected ?string $description = null;

    /** @var ?string Optional plain-text content for document sources. */
    protected ?string $content = null;

    /** @var ?string Optional JSON filter identifying the vectors of an external source. */
    protected ?string $externalfilter = null;

    /** @var ?source_citation Optional source-level citation metadata. */
    protected ?source_citation $citation = null;

    /** @var ?int Vector store instance id (local_ai_manager_vecstore.id) holding this source's vectors. */
    protected ?int $vecstoreid = null;

    /** @var ?string Name of the embedding model used to index this source. */
    protected ?string $embeddingmodel = null;

    /** @var ?string SHA-256 of the last indexed content, used for change detection. */
    protected ?string $contenthash = null;

    /** @var bool Whether this source participates in RAG retrieval. */
    protected bool $enabled = true;

    /** @var bool Whether this source can be indexed. */
    protected bool $allowindex = false;

    /** @var int Last indexing timestamp. */
    protected int $lastindexed = 0;

    /** @var string Current indexing status for UI/task tracking. */
    protected string $indexstatus = self::INDEXSTATUS_IDLE;

    /** @var ?int Last queued adhoc indexing task id. */
    protected ?int $indextaskid = null;

    /** @var ?string Error message of the last failed indexing run. */
    protected ?string $indexerror = null;

    /** @var ?string Technical details of the last failed indexing run. */
    protected ?string $indexdebuginfo = null;

    /** @var string Source is currently not queued/running for indexing. */
    public const INDEXSTATUS_IDLE = 'idle';

    /** @var string Source indexing was queued as adhoc task. */
    public const INDEXSTATUS_QUEUED = 'queued';

    /** @var string Source is actively being indexed. */
    public const INDEXSTATUS_RUNNING = 'running';

    /** @var string Source indexing completed successfully. */
    public const INDEXSTATUS_INDEXED = 'indexed';

    /** @var string Source indexing failed. */
    public const INDEXSTATUS_FAILED = 'failed';

    /** @var int User id that last modified this record. */
    protected int $usermodified = 0;

    /** @var int Created timestamp. */
    protected int $timecreated = 0;

    /** @var int Modified timestamp. */
    protected int $timemodified = 0;

    /**
     * Constructor.
     *
     * @param int $id Existing record id, or 0 for a new object.
     */
    public function __construct(int $id = 0) {
        $this->id = $id;
        $this->load();
    }

    /**
     * Load this object from DB when id exists.
     */
    public function load(): void {
        global $DB;

        $record = $DB->get_record('local_ai_content_sources', ['id' => $this->id]);
        if (!$record) {
            return;
        }
        $this->map_record($record);
    }

    /**
     * Persist the object to DB.
     */
    public function store(): void {
        global $DB, $USER;

        $clock = \core\di::get(\core\clock::class);
        $record = new \stdClass();
        $record->contextid = $this->contextid;
        $record->sourcetype = $this->sourcetype;
        $record->cmid = $this->cmid;
        $record->name = $this->name;
        $record->description = $this->description;
        $record->content = $this->content;
        $record->externalfilter = $this->externalfilter;
        $record->citation = $this->citation !== null ? $this->citation->to_json() : null;
        $record->vecstoreid = $this->vecstoreid;
        $record->embeddingmodel = $this->embeddingmodel;
        $record->contenthash = $this->contenthash;
        $record->enabled = $this->enabled ? 1 : 0;
        $record->allowindex = $this->allowindex ? 1 : 0;
        $record->lastindexed = $this->lastindexed;
        $record->indexstatus = $this->indexstatus;
        $record->indextaskid = $this->indextaskid;
        $record->indexerror = $this->indexerror;
        $record->indexdebuginfo = $this->indexdebuginfo;
        $record->usermodified = $this->usermodified ?: (int)($USER->id ?? 0);
        $record->timemodified = $clock->time();

        if ($this->record === null) {
            $record->timecreated = $record->timemodified;
            $record->id = $DB->insert_record('local_ai_content_sources', $record);
            $this->id = (int)$record->id;
        } else {
            $record->id = $this->id;
            $record->timecreated = $this->timecreated;
            $DB->update_record('local_ai_content_sources', $record);
        }

        $this->map_record($record);
    }

    /**
     * Retrieve one source instance by arbitrary conditions.
     *
     * @param array $conditions DML conditions.
     * @return ?self Null when not found.
     */
    public static function get_record(array $conditions): ?self {
        global $DB;

        $record = $DB->get_record('local_ai_content_sources', $conditions);
        if (!$record) {
            return null;
        }
        return self::from_record($record);
    }

    /**
     * Retrieve source instances by cmid list.
     *
     * @param int[] $cmids Course module ids.
     * @return self[]
     */
    public static function get_records_by_cmids(array $cmids): array {
        global $DB;

        $cmids = array_values(array_unique(array_filter(array_map('intval', $cmids))));
        if (empty($cmids)) {
            return [];
        }
        $records = $DB->get_records_list('local_ai_content_sources', 'cmid', $cmids);
        $instances = [];
        foreach ($records as $record) {
            $instances[] = self::from_record($record);
        }
        return $instances;
    }

    /**
     * Return module source wrappers for a course.
     *
     * @param \stdClass $course Course record.
     * @return array{0: array, 1: self[]} [raw activities, source wrappers]
     */
    public static function get_module_sources_for_course(\stdClass $course): array {
        global $CFG;

        require_once($CFG->dirroot . '/course/lib.php');

        $activities = modinfo::get_array_of_activities($course);
        $cmids = array_keys($activities);
        if (empty($cmids)) {
            return [$activities, []];
        }
        $sources = self::get_records_by_cmids($cmids);
        return [$activities, $sources];
    }

    /**
     * Retrieve source instances attached to any of the given context ids.
     *
     * @param int[] $contextids Moodle context ids.
     * @return self[]
     */
    public static function get_records_by_contextids(array $contextids): array {
        global $DB;

        $contextids = array_values(array_unique(array_filter(array_map('intval', $contextids))));
        if (empty($contextids)) {
            return [];
        }
        $records = $DB->get_records_list('local_ai_content_sources', 'contextid', $contextids);
        $instances = [];
        foreach ($records as $record) {
            $instances[] = self::from_record($record);
        }
        return $instances;
    }

    /**
     * Retrieve source instances by their record ids.
     *
     * @param int[] $ids local_ai_content_sources record ids.
     * @return self[] Indexed by record id.
     */
    public static function get_records_by_ids(array $ids): array {
        global $DB;

        $ids = array_values(array_unique(array_filter(array_map('intval', $ids))));
        if (empty($ids)) {
            return [];
        }
        $records = $DB->get_records_list('local_ai_content_sources', 'id', $ids);
        $instances = [];
        foreach ($records as $record) {
            $instances[(int) $record->id] = self::from_record($record);
        }
        return $instances;
    }

    /**
     * Build wrapper object from DB record.
     *
     * @param \stdClass $record Database record.
     * @return self
     */
    public static function from_record(\stdClass $record): self {
        $source = new self();
        $source->map_record($record);
        return $source;
    }

    /**
     * Map DB data into object properties.
     *
     * @param \stdClass $record Database record.
     */
    protected function map_record(\stdClass $record): void {
        $this->record = $record;
        $this->id = (int)$record->id;
        $this->contextid = (int)$record->contextid;
        $this->sourcetype = (string)$record->sourcetype;
        $this->cmid = isset($record->cmid) ? (int)$record->cmid : null;
        $this->name = $record->name ?? null;
        $this->description = $record->description ?? null;
        $this->content = $record->content ?? null;
        $this->externalfilter = $record->externalfilter ?? null;
        $this->citation = source_citation::from_json($record->citation ?? null);
        $this->vecstoreid = isset($record->vecstoreid) ? (int)$record->vecstoreid : null;
        $this->embeddingmodel = $record->embeddingmodel ?? null;
        $this->contenthash = $record->contenthash ?? null;
        $this->enabled = !empty($record->enabled);
        $this->allowindex = !empty($record->allowindex);
        $this->lastindexed = (int)($record->lastindexed ?? 0);
        $this->indexstatus = (string)($record->indexstatus ?? self::INDEXSTATUS_IDLE);
        $this->indextaskid = isset($record->indextaskid) ? (int)$record->indextaskid : null;
        $this->indexerror = $record->indexerror ?? null;
        $this->indexdebuginfo = $record->indexdebuginfo ?? null;
        $this->usermodified = (int)($record->usermodified ?? 0);
        $this->timecreated = (int)($record->timecreated ?? 0);
        $this->timemodified = (int)($record->timemodified ?? 0);
    }

    /** @return int */
    public function get_id(): int {
        return $this->id;
    }

    /** @return ?int */
    public function get_cmid(): ?int {
        return $this->cmid;
    }

    /** @param ?int $cmid */
    public function set_cmid(?int $cmid): void {
        $this->cmid = $cmid;
    }

    /** @return int */
    public function get_contextid(): int {
        return $this->contextid;
    }

    /** @param int $contextid */
    public function set_contextid(int $contextid): void {
        $this->contextid = $contextid;
    }

    /** @return bool */
    public function get_allowindex(): bool {
        return $this->allowindex;
    }

    /** @param bool $allowindex */
    public function set_allowindex(bool $allowindex): void {
        $this->allowindex = $allowindex;
    }

    /** @return int */
    public function get_lastindexed(): int {
        return $this->lastindexed;
    }

    /** @param int $lastindexed */
    public function set_lastindexed(int $lastindexed): void {
        $this->lastindexed = $lastindexed;
    }

    /** @return string */
    public function get_indexstatus(): string {
        return $this->indexstatus;
    }

    /** @param string $indexstatus */
    public function set_indexstatus(string $indexstatus): void {
        $this->indexstatus = $indexstatus;
    }

    /** @return ?int */
    public function get_indextaskid(): ?int {
        return $this->indextaskid;
    }

    /** @param ?int $indextaskid */
    public function set_indextaskid(?int $indextaskid): void {
        $this->indextaskid = $indextaskid;
    }

    /** @return ?string */
    public function get_indexerror(): ?string {
        return $this->indexerror;
    }

    /** @param ?string $indexerror */
    public function set_indexerror(?string $indexerror): void {
        $this->indexerror = $indexerror;
    }

    /** @return ?string */
    public function get_indexdebuginfo(): ?string {
        return $this->indexdebuginfo;
    }

    /** @param ?string $indexdebuginfo */
    public function set_indexdebuginfo(?string $indexdebuginfo): void {
        $this->indexdebuginfo = $indexdebuginfo;
    }

    /** @return string */
    public function get_sourcetype(): string {
        return $this->sourcetype;
    }

    /** @param string $sourcetype */
    public function set_sourcetype(string $sourcetype): void {
        $this->sourcetype = $sourcetype;
    }

    /** @return bool */
    public function get_enabled(): bool {
        return $this->enabled;
    }

    /** @param bool $enabled */
    public function set_enabled(bool $enabled): void {
        $this->enabled = $enabled;
    }

    /** @return ?string */
    public function get_name(): ?string {
        return $this->name;
    }

    /** @param ?string $name */
    public function set_name(?string $name): void {
        $this->name = $name;
    }

    /** @return ?string */
    public function get_description(): ?string {
        return $this->description;
    }

    /** @param ?string $description */
    public function set_description(?string $description): void {
        $this->description = $description;
    }

    /** @return ?string */
    public function get_content(): ?string {
        return $this->content;
    }

    /** @param ?string $content */
    public function set_content(?string $content): void {
        $this->content = $content;
    }

    /** @return ?string */
    public function get_externalfilter(): ?string {
        return $this->externalfilter;
    }

    /** @param ?string $externalfilter */
    public function set_externalfilter(?string $externalfilter): void {
        $this->externalfilter = $externalfilter;
    }

    /** @return ?int */
    public function get_vecstoreid(): ?int {
        return $this->vecstoreid;
    }

    /** @param ?int $vecstoreid */
    public function set_vecstoreid(?int $vecstoreid): void {
        $this->vecstoreid = $vecstoreid;
    }

    /** @return ?string */
    public function get_embeddingmodel(): ?string {
        return $this->embeddingmodel;
    }

    /** @param ?string $embeddingmodel */
    public function set_embeddingmodel(?string $embeddingmodel): void {
        $this->embeddingmodel = $embeddingmodel;
    }

    /** @return ?string */
    public function get_contenthash(): ?string {
        return $this->contenthash;
    }

    /** @param ?string $contenthash */
    public function set_contenthash(?string $contenthash): void {
        $this->contenthash = $contenthash;
    }

    /** @return ?source_citation */
    public function get_citation(): ?source_citation {
        return $this->citation;
    }

    /** @param ?source_citation $citation */
    public function set_citation(?source_citation $citation): void {
        $this->citation = $citation;
    }

    /**
     * Returns the citation to display for this source, deriving sensible defaults from the source itself.
     *
     * The stored source-level citation (if any) always takes precedence. Missing fields are filled from the
     * source: an empty title falls back to the source name, and for internal module sources an empty URL is
     * derived from the related course module. External sources are expected to carry their own citation.
     *
     * @return source_citation the effective citation (may still be empty if nothing could be derived)
     */
    public function get_effective_citation(): source_citation {
        $citation = $this->citation ?? source_citation::create();

        if ($citation->get_title() === '' && !empty($this->name)) {
            $citation->set_title((string) $this->name);
        }

        if ($citation->get_url() === '' && $this->sourcetype === self::TYPE_MODULE && !empty($this->cmid)) {
            $url = $this->derive_module_url($this->cmid);
            if ($url !== '') {
                $citation->set_url($url);
            }
        }

        return $citation;
    }

    /**
     * Derives the view URL of a course module from its id.
     *
     * @param int $cmid The course module id.
     * @return string The module view URL, or an empty string if it could not be derived.
     */
    protected function derive_module_url(int $cmid): string {
        $cm = get_coursemodule_from_id('', $cmid, 0, false, IGNORE_MISSING);
        if (!$cm) {
            return '';
        }
        return (new \moodle_url('/mod/' . $cm->modname . '/view.php', ['id' => $cm->id]))->out(false);
    }
}

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
 * Wrapper for a record of local_ai_content_index: the index of one source for one embedding model.
 *
 * Vectors of different embedding models cannot be compared with each other, so a source can only be searched with an
 * embedding model it has been indexed with. The vectors live in the collection of the embedding model inside the vector
 * store instance the source is bound to.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class model_index {
    /** @var string Indexing has been queued as adhoc task. */
    public const STATUS_QUEUED = 'queued';

    /** @var string Indexing is running. */
    public const STATUS_RUNNING = 'running';

    /** @var string Indexing has completed successfully. */
    public const STATUS_INDEXED = 'indexed';

    /** @var string Indexing has failed. */
    public const STATUS_FAILED = 'failed';

    /** @var ?\stdClass Raw DB record, null if not stored yet. */
    protected ?\stdClass $record = null;

    /** @var int Record id. */
    protected int $id = 0;

    /** @var int Id of the indexed source. */
    protected int $sourceid = 0;

    /** @var string Name of the embedding model the source is indexed with. */
    protected string $embeddingmodel = '';

    /** @var string One of the STATUS_* constants. */
    protected string $status = self::STATUS_QUEUED;

    /** @var ?int Last queued adhoc task id. */
    protected ?int $taskid = null;

    /** @var ?string Error message of the last failed indexing run. */
    protected ?string $error = null;

    /** @var ?string Technical details of the last failed indexing run. */
    protected ?string $debuginfo = null;

    /** @var ?string SHA-256 of the last indexed content. */
    protected ?string $contenthash = null;

    /** @var int Timestamp of the last successful indexing run. */
    protected int $lastindexed = 0;

    /** @var int User who started the last indexing run. */
    protected int $usermodified = 0;

    /** @var int Created timestamp. */
    protected int $timecreated = 0;

    /**
     * Constructor.
     *
     * @param int $id Existing record id, or 0 for a new object.
     */
    public function __construct(int $id = 0) {
        global $DB;

        if ($id === 0) {
            return;
        }
        $this->map_record($DB->get_record('local_ai_content_index', ['id' => $id], '*', MUST_EXIST));
    }

    /**
     * Create a new, not yet stored index of a source for an embedding model.
     *
     * @param int $sourceid Id of the source.
     * @param string $embeddingmodel Name of the embedding model.
     * @return self The new index.
     */
    public static function create(int $sourceid, string $embeddingmodel): self {
        $index = new self();
        $index->sourceid = $sourceid;
        $index->embeddingmodel = $embeddingmodel;
        return $index;
    }

    /**
     * Persist the object to DB.
     */
    public function store(): void {
        global $DB, $USER;

        $record = new \stdClass();
        $record->sourceid = $this->sourceid;
        $record->embeddingmodel = $this->embeddingmodel;
        $record->status = $this->status;
        $record->taskid = $this->taskid;
        $record->error = $this->error;
        $record->debuginfo = $this->debuginfo;
        $record->contenthash = $this->contenthash;
        $record->lastindexed = $this->lastindexed;
        $record->usermodified = $this->usermodified ?: (int) $USER->id;
        $record->timemodified = \core\di::get(\core\clock::class)->time();

        if ($this->record === null) {
            $record->timecreated = $record->timemodified;
            $record->id = $DB->insert_record('local_ai_content_index', $record);
        } else {
            $record->id = $this->id;
            $record->timecreated = $this->timecreated;
            $DB->update_record('local_ai_content_index', $record);
        }

        $this->map_record($record);
    }

    /**
     * Retrieve the index of a source for an embedding model.
     *
     * @param int $sourceid Id of the source.
     * @param string $embeddingmodel Name of the embedding model.
     * @return ?self Null if the source is not indexed with this model.
     */
    public static function get(int $sourceid, string $embeddingmodel): ?self {
        global $DB;

        $record = $DB->get_record('local_ai_content_index', ['sourceid' => $sourceid, 'embeddingmodel' => $embeddingmodel]);
        return $record ? self::from_record($record) : null;
    }

    /**
     * Retrieve the indexes of the given sources.
     *
     * @param int[] $sourceids Ids of the sources.
     * @return array<int, self[]> The indexes indexed by source id and embedding model name, sources without index are omitted.
     */
    public static function get_for_sources(array $sourceids): array {
        global $DB;

        $sourceids = array_values(array_unique(array_filter(array_map('intval', $sourceids))));
        if (empty($sourceids)) {
            return [];
        }
        $indexes = [];
        foreach ($DB->get_records_list('local_ai_content_index', 'sourceid', $sourceids, 'embeddingmodel') as $record) {
            $indexes[(int) $record->sourceid][$record->embeddingmodel] = self::from_record($record);
        }
        return $indexes;
    }

    /**
     * Whether a source has been indexed successfully with at least one embedding model.
     *
     * @param int $sourceid Id of the source.
     * @return bool True if at least one index of the source is complete.
     */
    public static function is_source_indexed(int $sourceid): bool {
        global $DB;

        return $DB->record_exists('local_ai_content_index', ['sourceid' => $sourceid, 'status' => self::STATUS_INDEXED]);
    }

    /**
     * Build wrapper object from DB record.
     *
     * @param \stdClass $record Database record.
     * @return self The wrapper.
     */
    public static function from_record(\stdClass $record): self {
        $index = new self();
        $index->map_record($record);
        return $index;
    }

    /**
     * Map DB data into object properties.
     *
     * @param \stdClass $record Database record.
     */
    protected function map_record(\stdClass $record): void {
        $this->record = $record;
        $this->id = (int) $record->id;
        $this->sourceid = (int) $record->sourceid;
        $this->embeddingmodel = $record->embeddingmodel;
        $this->status = $record->status;
        $this->taskid = $record->taskid === null ? null : (int) $record->taskid;
        $this->error = $record->error;
        $this->debuginfo = $record->debuginfo;
        $this->contenthash = $record->contenthash;
        $this->lastindexed = (int) $record->lastindexed;
        $this->usermodified = (int) $record->usermodified;
        $this->timecreated = (int) $record->timecreated;
    }

    /**
     * Whether an indexing task is currently queued or running.
     *
     * @return bool True if indexing is queued or running.
     */
    public function is_active(): bool {
        return in_array($this->status, [self::STATUS_QUEUED, self::STATUS_RUNNING], true);
    }

    /** @return int Record id, 0 if not stored yet. */
    public function get_id(): int {
        return $this->id;
    }

    /** @return int Id of the indexed source. */
    public function get_sourceid(): int {
        return $this->sourceid;
    }

    /** @return string Name of the embedding model. */
    public function get_embeddingmodel(): string {
        return $this->embeddingmodel;
    }

    /** @return string One of the STATUS_* constants. */
    public function get_status(): string {
        return $this->status;
    }

    /** @param string $status One of the STATUS_* constants. */
    public function set_status(string $status): void {
        $this->status = $status;
    }

    /** @return ?int Last queued adhoc task id. */
    public function get_taskid(): ?int {
        return $this->taskid;
    }

    /** @param ?int $taskid Last queued adhoc task id. */
    public function set_taskid(?int $taskid): void {
        $this->taskid = $taskid;
    }

    /** @return ?string Error message of the last failed indexing run. */
    public function get_error(): ?string {
        return $this->error;
    }

    /** @param ?string $error Error message of the last failed indexing run. */
    public function set_error(?string $error): void {
        $this->error = $error;
    }

    /** @return ?string Technical details of the last failed indexing run. */
    public function get_debuginfo(): ?string {
        return $this->debuginfo;
    }

    /** @param ?string $debuginfo Technical details of the last failed indexing run. */
    public function set_debuginfo(?string $debuginfo): void {
        $this->debuginfo = $debuginfo;
    }

    /** @return ?string SHA-256 of the last indexed content. */
    public function get_contenthash(): ?string {
        return $this->contenthash;
    }

    /** @param ?string $contenthash SHA-256 of the last indexed content. */
    public function set_contenthash(?string $contenthash): void {
        $this->contenthash = $contenthash;
    }

    /** @return int Timestamp of the last successful indexing run. */
    public function get_lastindexed(): int {
        return $this->lastindexed;
    }

    /** @param int $lastindexed Timestamp of the last successful indexing run. */
    public function set_lastindexed(int $lastindexed): void {
        $this->lastindexed = $lastindexed;
    }

    /** @param int $usermodified User who started the last indexing run. */
    public function set_usermodified(int $usermodified): void {
        $this->usermodified = $usermodified;
    }
}


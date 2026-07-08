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

    /** @var ?string Optional plain-text content for document sources. */
    protected ?string $content = null;

    /** @var bool Whether this source participates in RAG retrieval. */
    protected bool $rag = true;

    /** @var bool Whether this source can be indexed. */
    protected bool $allowindex = false;

    /** @var int Last indexing timestamp. */
    protected int $lastindexed = 0;

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
        $record->content = $this->content;
        $record->rag = $this->rag ? 1 : 0;
        $record->allowindex = $this->allowindex ? 1 : 0;
        $record->lastindexed = $this->lastindexed;
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
        $this->content = $record->content ?? null;
        $this->rag = !empty($record->rag);
        $this->allowindex = !empty($record->allowindex);
        $this->lastindexed = (int)($record->lastindexed ?? 0);
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

    /** @return string */
    public function get_sourcetype(): string {
        return $this->sourcetype;
    }

    /** @param string $sourcetype */
    public function set_sourcetype(string $sourcetype): void {
        $this->sourcetype = $sourcetype;
    }

    /** @return bool */
    public function get_rag(): bool {
        return $this->rag;
    }

    /** @param bool $rag */
    public function set_rag(bool $rag): void {
        $this->rag = $rag;
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
    public function get_content(): ?string {
        return $this->content;
    }

    /** @param ?string $content */
    public function set_content(?string $content): void {
        $this->content = $content;
    }
}

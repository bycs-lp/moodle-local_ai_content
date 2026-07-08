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

/**
 * Wrapper class for local_ai_content_sourceselection records.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_selection {
    /** @var ?\stdClass Raw DB record. */
    protected ?\stdClass $record = null;

    /** @var int Record id. */
    protected int $id = 0;

    /** @var int Moodle context id. */
    protected int $contextid = 0;

    /** @var int[] Source IDs as normalized integer list. */
    protected array $sourceids = [];

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

        $record = $DB->get_record('local_ai_content_sourceselection', ['id' => $this->id]);
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
        $record->sourceids = empty($this->sourceids) ? null : implode(',', $this->sourceids);
        $record->usermodified = $this->usermodified ?: (int)($USER->id ?? 0);
        $record->timemodified = $clock->time();

        if ($this->record === null) {
            $record->timecreated = $record->timemodified;
            $record->id = $DB->insert_record('local_ai_content_sourceselection', $record);
            $this->id = (int)$record->id;
        } else {
            $record->id = $this->id;
            $record->timecreated = $this->timecreated;
            $DB->update_record('local_ai_content_sourceselection', $record);
        }

        $this->map_record($record);
    }

    /**
     * Get one record by contextid.
     *
     * @param int $contextid Moodle context id.
     * @return ?self Null when not found.
     */
    public static function get_by_contextid(int $contextid): ?self {
        global $DB;

        $record = $DB->get_record('local_ai_content_sourceselection', ['contextid' => $contextid]);
        if (!$record) {
            return null;
        }
        return self::from_record($record);
    }

    /**
     * Build wrapper object from DB record.
     *
     * @param \stdClass $record Database record.
     * @return self
     */
    public static function from_record(\stdClass $record): self {
        $selection = new self();
        $selection->map_record($record);
        return $selection;
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
        $serializedsourceids = (string) ($record->sourceids ?? '');
        if ($serializedsourceids === '') {
            $this->sourceids = [];
        } else {
            $this->sourceids = $this->normalize_sourceids(explode(',', $serializedsourceids));
        }
        $this->usermodified = (int)($record->usermodified ?? 0);
        $this->timecreated = (int)($record->timecreated ?? 0);
        $this->timemodified = (int)($record->timemodified ?? 0);
    }

    /** @return int */
    public function get_id(): int {
        return $this->id;
    }

    /** @return int */
    public function get_contextid(): int {
        return $this->contextid;
    }

    /** @param int $contextid */
    public function set_contextid(int $contextid): void {
        $this->contextid = $contextid;
    }

    /** @return int[] */
    public function get_sourceids(): array {
        return $this->sourceids;
    }

    /**
     * @param array $sourceids
     */
    public function set_sourceids(array $sourceids): void {
        $this->sourceids = $this->normalize_sourceids($sourceids);
    }

    /**
     * Normalize source ids to unique, positive ints.
     *
     * @param array $sourceids
     * @return int[]
     */
    protected function normalize_sourceids(array $sourceids): array {
        $sourceids = array_values(array_unique(array_filter(array_map('intval', $sourceids), static fn(int $id): bool => $id > 0)));
        return $sourceids;
    }
}



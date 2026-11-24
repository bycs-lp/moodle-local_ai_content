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
 * Store of the source selections of contexts (table local_ai_content_selection).
 *
 * Represents the n:m relation between Moodle contexts and the sources that are activated for RAG retrieval in
 * that context. Obtain it via dependency injection.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_selection_store {
    /** @var string Selection mode: the excerpts of the source relevant for the request are searched and added. */
    public const MODE_SEARCH = 'search';

    /** @var string Selection mode: the complete content of the source is added to every request. */
    public const MODE_FULL = 'full';

    /** @var int Number of selection rows deleted with one statement. */
    private const DELETE_CHUNK_SIZE = 500;

    /**
     * Constructor.
     *
     * @param \core\clock $clock Clock for the timestamps of the selection rows.
     */
    public function __construct(
        /** @var \core\clock Clock for the timestamps of the selection rows. */
        private readonly \core\clock $clock,
    ) {
    }

    /**
     * Returns the source ids activated for a single context.
     *
     * @param int $contextid The Moodle context id.
     * @return int[] The activated source ids.
     */
    public function get_sourceids_for_context(int $contextid): array {
        return $this->get_sourceids_for_contexts([$contextid]);
    }

    /**
     * Returns the source ids activated for any of the given contexts.
     *
     * @param int[] $contextids The Moodle context ids.
     * @return int[] The activated source ids (unique).
     */
    public function get_sourceids_for_contexts(array $contextids): array {
        global $DB;

        $contextids = array_values(array_unique(array_filter(array_map('intval', $contextids))));
        if (empty($contextids)) {
            return [];
        }
        [$insql, $inparams] = $DB->get_in_or_equal($contextids, SQL_PARAMS_NAMED);
        $records = $DB->get_records_select('local_ai_content_selection', 'contextid ' . $insql, $inparams, '',
            'DISTINCT sourceid');
        return array_values(array_map(static fn($record): int => (int) $record->sourceid, $records));
    }

    /**
     * Returns the selected sources of a single context with their selection mode.
     *
     * @param int $contextid The Moodle context id.
     * @return array<int, string> The selection mode (one of the MODE_* constants) indexed by source id.
     */
    public function get_modes_for_context(int $contextid): array {
        global $DB;

        $records = $DB->get_records('local_ai_content_selection', ['contextid' => $contextid], '', 'sourceid, mode');
        $modes = [];
        foreach ($records as $record) {
            $modes[(int) $record->sourceid] = $record->mode;
        }
        return $modes;
    }

    /**
     * Replaces the selected sources of a context.
     *
     * All existing selections of the context are removed and the given sources are inserted.
     *
     * @param int $contextid The Moodle context id.
     * @param array<int, string> $modes The selection mode (one of the MODE_* constants) indexed by source id.
     */
    public function set_selection_for_context(int $contextid, array $modes): void {
        global $DB, $USER;

        $now = $this->clock->time();

        $transaction = $DB->start_delegated_transaction();
        $DB->delete_records('local_ai_content_selection', ['contextid' => $contextid]);
        foreach ($modes as $sourceid => $mode) {
            if (!in_array($mode, [self::MODE_SEARCH, self::MODE_FULL], true)) {
                throw new \coding_exception('Invalid source selection mode: ' . $mode);
            }
            $DB->insert_record('local_ai_content_selection', (object) [
                'contextid' => $contextid,
                'sourceid' => (int) $sourceid,
                'mode' => $mode,
                'usermodified' => (int) $USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
        $transaction->allow_commit();
    }

    /**
     * Removes the selections of contexts that no longer exist.
     *
     * Moodle has no hook for deleted contexts, so the selections of deleted contexts (of any plugin) are cleaned up
     * afterwards. The orphaned rows are read in one pass and deleted in chunks to keep the writesets small.
     *
     * @return int Number of deleted selection rows.
     */
    public function delete_for_deleted_contexts(): int {
        global $DB;

        $sql = 'SELECT sel.id
                  FROM {local_ai_content_selection} sel
                 WHERE NOT EXISTS (SELECT 1 FROM {context} ctx WHERE ctx.id = sel.contextid)';
        $deleted = 0;
        $ids = [];
        $records = $DB->get_recordset_sql($sql);
        foreach ($records as $record) {
            $ids[] = $record->id;
            if (count($ids) === self::DELETE_CHUNK_SIZE) {
                $DB->delete_records_list('local_ai_content_selection', 'id', $ids);
                $deleted += count($ids);
                $ids = [];
            }
        }
        $records->close();
        if (!empty($ids)) {
            $DB->delete_records_list('local_ai_content_selection', 'id', $ids);
            $deleted += count($ids);
        }

        return $deleted;
    }
}


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
 * Helper for the local_ai_content_ctx_sources junction table.
 *
 * Represents the n:m relation between Moodle contexts and the sources that are activated for RAG retrieval in
 * that context. Replaces the previous comma-separated sourceids storage.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class context_source {
    /** @var int Number of selection rows deleted with one statement. */
    private const DELETE_CHUNK_SIZE = 500;

    /**
     * Returns the source ids activated for a single context.
     *
     * @param int $contextid The Moodle context id.
     * @return int[] The activated source ids.
     */
    public static function get_sourceids_for_context(int $contextid): array {
        return self::get_sourceids_for_contexts([$contextid]);
    }

    /**
     * Returns the source ids activated for any of the given contexts.
     *
     * @param int[] $contextids The Moodle context ids.
     * @return int[] The activated source ids (unique).
     */
    public static function get_sourceids_for_contexts(array $contextids): array {
        global $DB;

        $contextids = array_values(array_unique(array_filter(array_map('intval', $contextids))));
        if (empty($contextids)) {
            return [];
        }
        [$insql, $inparams] = $DB->get_in_or_equal($contextids, SQL_PARAMS_NAMED);
        $records = $DB->get_records_select('local_ai_content_ctx_sources', 'contextid ' . $insql, $inparams, '',
            'DISTINCT sourceid');
        return array_values(array_map(static fn($record): int => (int) $record->sourceid, $records));
    }

    /**
     * Replaces the set of activated sources for a context.
     *
     * All existing activations for the context are removed and the given source ids are inserted.
     *
     * @param int $contextid The Moodle context id.
     * @param int[] $sourceids The source ids to activate for the context.
     */
    public static function set_sourceids_for_context(int $contextid, array $sourceids): void {
        global $DB, $USER;

        $sourceids = array_values(array_unique(array_filter(
            array_map('intval', $sourceids),
            static fn(int $id): bool => $id > 0
        )));

        $clock = \core\di::get(\core\clock::class);
        $now = $clock->time();

        $transaction = $DB->start_delegated_transaction();
        $DB->delete_records('local_ai_content_ctx_sources', ['contextid' => $contextid]);
        foreach ($sourceids as $sourceid) {
            $DB->insert_record('local_ai_content_ctx_sources', (object) [
                'contextid' => $contextid,
                'sourceid' => $sourceid,
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
    public static function delete_for_deleted_contexts(): int {
        global $DB;

        $sql = 'SELECT cs.id
                  FROM {local_ai_content_ctx_sources} cs
                 WHERE NOT EXISTS (SELECT 1 FROM {context} ctx WHERE ctx.id = cs.contextid)';
        $deleted = 0;
        $ids = [];
        $records = $DB->get_recordset_sql($sql);
        foreach ($records as $record) {
            $ids[] = $record->id;
            if (count($ids) === self::DELETE_CHUNK_SIZE) {
                $DB->delete_records_list('local_ai_content_ctx_sources', 'id', $ids);
                $deleted += count($ids);
                $ids = [];
            }
        }
        $records->close();
        if (!empty($ids)) {
            $DB->delete_records_list('local_ai_content_ctx_sources', 'id', $ids);
            $deleted += count($ids);
        }

        return $deleted;
    }
}
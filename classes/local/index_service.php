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
use local_ai_content\task\index_source_adhoc;
use local_ai_manager\base_vecstore;
use local_ai_manager\local\vecstore_factory;

/**
 * Service controlling the indexing lifecycle of a source.
 *
 * Every operation returns the resulting {@see index_state} so that callers never have to derive the
 * status themselves.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class index_service {
    /** @var int Number of sources whose vectors are deleted with one vector store request. */
    private const DELETE_CHUNK_SIZE = 500;

    /**
     * Constructor.
     *
     * @param source_management_access $access Access service for source management checks.
     */
    public function __construct(
        /** @var source_management_access Access service for source management checks. */
        private readonly source_management_access $access,
    ) {
    }

    /**
     * Switch indexing on or off for one source, enforcing management access.
     *
     * @param int $sourceid The source record id.
     * @param bool $allowindex Whether indexing should be switched on.
     * @return index_state The resulting state.
     */
    public function set_allow_index(int $sourceid, bool $allowindex): index_state {
        $source = source::get_record(['id' => $sourceid]);
        if ($source === null) {
            throw new \invalid_parameter_exception('Source not found.');
        }
        $this->access->require_manage_access_for_source($source);

        return $allowindex ? $this->start($source) : $this->stop($source);
    }

    /**
     * Queue an indexing task for one source.
     *
     * A source not bound to a vector store yet is bound to the current primary vector store, all its vectors
     * are stored there.
     *
     * @param source $source The source to index.
     * @return index_state The resulting state.
     */
    public function start(source $source): index_state {
        global $USER;

        if (!$source->get_enabled()) {
            throw new \invalid_parameter_exception('Source must be enabled before indexing can be started.');
        }

        if (!$source->get_vecstoreid()) {
            $primary = \core\di::get(vecstore_factory::class)->get_primary_instance();
            if ($primary === null) {
                throw new \moodle_exception('error_novecstore', 'local_ai_content');
            }
            $source->set_vecstoreid($primary->get_id());
        }

        $task = new index_source_adhoc();
        $task->set_custom_data(['sourceid' => $source->get_id()]);
        $task->set_userid((int) $USER->id);
        $taskid = \core\task\manager::queue_adhoc_task($task);

        $task->set_id($taskid);
        $task->initialise_stored_progress();

        $source->set_allowindex(true);
        $source->set_indextaskid($taskid);
        $source->set_indexstatus(source::INDEXSTATUS_QUEUED);
        $source->set_indexerror(null);
        $source->set_indexdebuginfo(null);
        $source->store();

        return index_state::from_source($source);
    }

    /**
     * Remove all vectors of one source from its vector store and reset its indexing state.
     *
     * Detaching the task id makes any queued indexing task for this source a no-op. The source is unbound from its
     * vector store, so indexing it again uses the then primary vector store.
     *
     * @param source $source The source to stop indexing for.
     * @return index_state The resulting state.
     */
    public function stop(source $source): index_state {
        $this->delete_embeddings($source);

        $source->set_vecstoreid(null);
        $source->set_allowindex(false);
        $source->set_indexstatus(source::INDEXSTATUS_IDLE);
        $source->set_indextaskid(null);
        $source->set_indexerror(null);
        $source->set_indexdebuginfo(null);
        $source->set_lastindexed(0);
        $source->store();

        return index_state::from_source($source);
    }

    /**
     * Return the indexing state of every enabled indexable source in the given contexts.
     *
     * Disabled sources cannot be indexed, so their state is not polled.
     *
     * @param int[] $contextids Moodle context ids.
     * @return array[] API representations of the states.
     */
    public function get_states_for_contexts(array $contextids): array {
        $states = [];
        foreach (source::get_records_by_contextids($contextids) as $source) {
            if (!in_array($source->get_sourcetype(), [source::TYPE_MODULE, source::TYPE_DOCUMENT], true)) {
                continue;
            }
            if (!$source->get_enabled()) {
                continue;
            }
            $states[] = index_state::from_source($source)->to_array();
        }

        return $states;
    }

    /**
     * Count the sources depending on a vector store instance.
     *
     * @param int $vecstoreid The vector store instance id.
     * @return array{sources: int, externalsources: int} Number of indexed (module and document) and external sources.
     */
    public function get_vecstore_usage(int $vecstoreid): array {
        global $DB;

        $params = ['vecstoreid' => $vecstoreid, 'external' => source::TYPE_EXTERNAL];
        return [
            'sources' => $DB->count_records_select('local_ai_content_sources',
                'vecstoreid = :vecstoreid AND sourcetype <> :external', $params),
            'externalsources' => $DB->count_records_select('local_ai_content_sources',
                'vecstoreid = :vecstoreid AND sourcetype = :external', $params),
        ];
    }

    /**
     * Detach all indexed sources from a vector store instance and reset them to "not indexed".
     *
     * Called before a vector store instance is deleted or stops being the primary one. Queued indexing tasks of the
     * affected sources become no-ops. External sources are never indexed by us, so their vectors are never deleted.
     *
     * @param int $vecstoreid The vector store instance id.
     * @param bool $deletevectors Whether the vectors of the indexed sources are deleted from the instance.
     * @param bool $disableexternalsources Whether the external sources referencing the instance are disabled.
     */
    public function release_vecstore(int $vecstoreid, bool $deletevectors, bool $disableexternalsources): void {
        global $DB;

        $select = 'vecstoreid = :vecstoreid AND sourcetype <> :external';
        $params = ['vecstoreid' => $vecstoreid, 'external' => source::TYPE_EXTERNAL];

        $vecstorefactory = \core\di::get(vecstore_factory::class);
        if ($deletevectors && $vecstorefactory->instance_exists($vecstoreid)) {
            $vecstore = $vecstorefactory->get_vecstore_by_id($vecstoreid);
            $sourceids = [];
            $records = $DB->get_recordset_select('local_ai_content_sources', $select, $params, 'id', 'id');
            foreach ($records as $record) {
                $sourceids[] = (int) $record->id;
                if (count($sourceids) === self::DELETE_CHUNK_SIZE) {
                    $this->delete_from_vecstore($vecstore, $sourceids);
                    $sourceids = [];
                }
            }
            $records->close();
            $this->delete_from_vecstore($vecstore, $sourceids);
        }

        $now = \core\di::get(\core\clock::class)->time();
        $DB->execute(
            "UPDATE {local_ai_content_sources}
                SET vecstoreid = NULL, allowindex = 0, indexstatus = :idle, indextaskid = NULL, indexerror = NULL,
                    indexdebuginfo = NULL, lastindexed = 0, timemodified = :now
              WHERE {$select}",
            $params + ['idle' => source::INDEXSTATUS_IDLE, 'now' => $now],
        );

        if ($disableexternalsources) {
            $DB->execute(
                'UPDATE {local_ai_content_sources}
                    SET enabled = 0, timemodified = :now
                  WHERE vecstoreid = :vecstoreid AND sourcetype = :external',
                $params + ['now' => $now],
            );
        }
    }

    /**
     * Delete all vectors of one source from the vector store it is bound to.
     *
     * Only needs the vector store, not the embedding purpose, so it also works if no embedding tool is configured.
     * Deleting is idempotent: if the source is not bound to a vector store or the vector store instance, its
     * collection or the vectors are already gone, there is nothing to delete.
     *
     * @param source $source The source whose vectors are deleted.
     */
    private function delete_embeddings(source $source): void {
        $vecstoreid = $source->get_vecstoreid();
        $vecstorefactory = \core\di::get(vecstore_factory::class);
        if (!$vecstoreid || !$vecstorefactory->instance_exists($vecstoreid)) {
            return;
        }

        $this->delete_from_vecstore($vecstorefactory->get_vecstore_by_id($vecstoreid), [$source->get_id()]);
    }

    /**
     * Delete the vectors of the given sources from a vector store.
     *
     * @param base_vecstore $vecstore The vector store.
     * @param int[] $sourceids The source ids.
     * @throws \moodle_exception If the vector store reports an error.
     */
    private function delete_from_vecstore(base_vecstore $vecstore, array $sourceids): void {
        if (empty($sourceids)) {
            return;
        }
        $response = $vecstore->delete_embeddings(...$sourceids);
        if ($response->get_code() !== 200) {
            throw new \moodle_exception('error_deleteembeddingsfailed', 'local_ai_content', '',
                $response->get_errormessage(), $response->get_debuginfo());
        }
    }
}

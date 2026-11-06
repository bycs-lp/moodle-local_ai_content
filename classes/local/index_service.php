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
use local_ai_content\task\check_source_changes_adhoc;
use local_ai_content\task\delete_vectors_adhoc;
use local_ai_content\task\index_source_adhoc;
use local_ai_manager\base_vecstore;
use local_ai_manager\local\vecstore_factory;

/**
 * Service controlling the indexing lifecycle of a source.
 *
 * A source is indexed with the embedding model of the user starting the indexing, who also pays for the embedding requests.
 * Users with another embedding model can add an index for their model (see {@see model_index}). Every operation returns the
 * resulting {@see index_state} so that callers never have to derive the status themselves.
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
     * @param embedding_model_resolver $modelresolver Resolver of the embedding model of the current user.
     * @param source_content_reader $contentreader Reader of the indexable content of sources.
     */
    public function __construct(
        /** @var source_management_access Access service for source management checks. */
        private readonly source_management_access $access,
        /** @var embedding_model_resolver Resolver of the embedding model of the current user. */
        private readonly embedding_model_resolver $modelresolver,
        /** @var source_content_reader Reader of the indexable content of sources. */
        private readonly source_content_reader $contentreader,
    ) {
    }

    /**
     * Switch indexing on or off for one source, enforcing management access.
     *
     * Switching indexing on while it is already on adds or restarts the index for the embedding model of the current user.
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
     * Queue an indexing task for one source with the embedding model of the current user.
     *
     * A source not bound to a vector store yet is bound to the current primary vector store, all its vectors
     * are stored there. Indexes of other embedding models are kept.
     *
     * @param source $source The source to index.
     * @return index_state The resulting state.
     * @throws \invalid_parameter_exception If the source is disabled.
     * @throws \moodle_exception If the current user has no embedding model.
     */
    public function start(source $source): index_state {
        global $DB, $USER;

        if (!$source->get_enabled()) {
            throw new \invalid_parameter_exception('Source must be enabled before indexing can be started.');
        }
        $model = $this->modelresolver->get_current_model();
        if ($model === null) {
            throw new \moodle_exception('error_noembeddingmodel', 'local_ai_content');
        }

        if (!$source->get_vecstoreid()) {
            $source->set_vecstoreid(\core\di::get(vecstore_factory::class)->get_primary_instance()->get_id());
        }

        // The task must not see the index before it is bound to the task.
        $transaction = $DB->start_delegated_transaction();
        $source->set_allowindex(true);
        $source->store();

        $task = new index_source_adhoc();
        $task->set_custom_data(['sourceid' => $source->get_id(), 'embeddingmodel' => $model]);
        $task->set_userid((int) $USER->id);
        $taskid = \core\task\manager::queue_adhoc_task($task);
        $task->set_id($taskid);
        $task->initialise_stored_progress();

        $index = model_index::get($source->get_id(), $model) ?? model_index::create($source->get_id(), $model);
        $index->set_status(model_index::STATUS_QUEUED);
        $index->set_taskid($taskid);
        $index->set_error(null);
        $index->set_debuginfo(null);
        $index->set_usermodified((int) $USER->id);
        $index->store();
        $transaction->allow_commit();

        return $this->get_state($source);
    }

    /**
     * Remove all vectors of one source from its vector store and reset its indexing state.
     *
     * Deleting the indexes makes any queued indexing task for this source a no-op. The source is unbound from its
     * vector store, so indexing it again uses the then primary vector store.
     *
     * @param source $source The source to stop indexing for.
     * @return index_state The resulting state.
     */
    public function stop(source $source): index_state {
        global $DB;

        $this->delete_embeddings($source, null);
        $DB->delete_records('local_ai_content_index', ['sourceid' => $source->get_id()]);

        $source->set_vecstoreid(null);
        $source->set_allowindex(false);
        $source->store();

        return $this->get_state($source);
    }

    /**
     * Re-index a source after its content has changed.
     *
     * The current user can only re-index with their own embedding model. Indexes of other embedding models are outdated
     * now and get deleted, they have to be created again by users with these embedding models.
     *
     * @param source $source The changed source.
     * @return index_state The resulting state.
     */
    public function reindex_changed_source(source $source): index_state {
        global $DB;

        $currentmodel = $this->modelresolver->get_current_model();
        foreach (model_index::get_for_sources([$source->get_id()])[$source->get_id()] ?? [] as $model => $index) {
            if ($model === $currentmodel) {
                continue;
            }
            $this->delete_embeddings($source, $model);
            $DB->delete_records('local_ai_content_index', ['id' => $index->get_id()]);
        }

        return $this->start($source);
    }

    /**
     * Queue the check for content changes of the source of an updated course module.
     *
     * Only queues the check if the module has a source with a completed index, so updates of other modules stay cheap.
     *
     * @param int $cmid The id of the updated course module.
     */
    public function queue_module_change_check(int $cmid): void {
        global $DB;

        $sourceid = $DB->get_field_sql(
            'SELECT s.id
               FROM {local_ai_content_sources} s
              WHERE s.cmid = :cmid AND s.sourcetype = :module AND s.allowindex = 1
                    AND EXISTS (SELECT 1 FROM {local_ai_content_index} i WHERE i.sourceid = s.id AND i.status = :indexed)',
            ['cmid' => $cmid, 'module' => source::TYPE_MODULE, 'indexed' => model_index::STATUS_INDEXED],
            IGNORE_MULTIPLE
        );
        if ($sourceid) {
            \core\task\manager::queue_adhoc_task(check_source_changes_adhoc::instance((int) $sourceid), true);
        }
    }

    /**
     * Mark the indexes of a source as outdated whose indexed content differs from the current content of the source.
     *
     * Only completed indexes are compared: queued and running indexes read the current content anyway, failed ones have no
     * vectors. Outdated indexes stay searchable until a source manager re-indexes them with their embedding model.
     *
     * @param int $sourceid The source record id.
     */
    public function check_source_changes(int $sourceid): void {
        global $DB;

        $source = source::get_record(['id' => $sourceid]);
        // The source may have been deleted or switched off since the check has been queued.
        if ($source === null || !$source->get_allowindex()) {
            return;
        }
        $indexes = array_filter(
            model_index::get_for_sources([$sourceid])[$sourceid] ?? [],
            static fn(model_index $index): bool => $index->get_status() === model_index::STATUS_INDEXED
        );
        if (empty($indexes)) {
            return;
        }

        $contenthash = $this->contentreader->hash_chunks($this->contentreader->get_chunks($source));
        $now = \core\di::get(\core\clock::class)->time();
        foreach ($indexes as $index) {
            if ($index->get_contenthash() === $contenthash) {
                continue;
            }
            // Conditional update, so an indexing run started meanwhile is not overwritten.
            $DB->execute(
                'UPDATE {local_ai_content_index}
                    SET status = :outdated, timemodified = :now
                  WHERE id = :id AND status = :indexed',
                [
                    'outdated' => model_index::STATUS_OUTDATED,
                    'now' => $now,
                    'id' => $index->get_id(),
                    'indexed' => model_index::STATUS_INDEXED,
                ],
            );
        }
    }

    /**
     * Return the indexing state of one source.
     *
     * @param source $source The source.
     * @return index_state The state.
     */
    public function get_state(source $source): index_state {
        return $this->get_states([$source])[$source->get_id()];
    }

    /**
     * Return the indexing states of the given sources.
     *
     * @param source[] $sources The sources.
     * @return index_state[] The states indexed by source id.
     */
    public function get_states(array $sources): array {
        $sourceids = array_map(static fn(source $source): int => $source->get_id(), $sources);
        $indexes = model_index::get_for_sources($sourceids);
        $currentmodel = $this->modelresolver->get_current_model();

        $states = [];
        foreach ($sources as $source) {
            $states[$source->get_id()] = index_state::from_source($source, $indexes[$source->get_id()] ?? [], $currentmodel);
        }
        return $states;
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
        $sources = array_filter(
            source::get_records_by_contextids($contextids),
            static fn(source $source): bool => $source->get_enabled()
                && in_array($source->get_sourcetype(), [source::TYPE_MODULE, source::TYPE_DOCUMENT], true)
        );

        return array_values(array_map(
            static fn(index_state $state): array => $state->to_array(),
            $this->get_states($sources)
        ));
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
        if ($deletevectors) {
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
        // Deleting the indexes makes queued indexing tasks no-ops.
        $DB->delete_records_select('local_ai_content_index',
            "sourceid IN (SELECT id FROM {local_ai_content_sources} WHERE {$select})", $params);
        $DB->execute(
            "UPDATE {local_ai_content_sources}
                SET vecstoreid = NULL, allowindex = 0, timemodified = :now
              WHERE {$select}",
            $params + ['now' => $now],
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
     * Delete the source of a course module, e.g. because the course module has been deleted.
     *
     * @param int $cmid The course module id.
     */
    public function delete_module_source(int $cmid): void {
        $this->delete_sources('cmid = :cmid AND sourcetype = :module', ['cmid' => $cmid, 'module' => source::TYPE_MODULE]);
    }

    /**
     * Delete all sources attached to a context, e.g. because the context is about to be deleted.
     *
     * @param int $contextid The Moodle context id.
     */
    public function delete_sources_in_context(int $contextid): void {
        $this->delete_sources('contextid = :contextid', ['contextid' => $contextid]);
    }

    /**
     * Delete the vectors of the given sources from a vector store instance.
     *
     * @param int $vecstoreid The vector store instance id.
     * @param int[] $sourceids The source ids.
     */
    public function delete_vectors(int $vecstoreid, array $sourceids): void {
        $vecstorefactory = \core\di::get(vecstore_factory::class);
        // The instance may have been deleted meanwhile, then there is no vector store left to delete from.
        if (!$vecstorefactory->instance_exists($vecstoreid)) {
            return;
        }
        $this->delete_from_vecstore($vecstorefactory->get_vecstore_by_id($vecstoreid), $sourceids);
    }

    /**
     * Delete sources together with their context selections and queue the deletion of their vectors.
     *
     * The vectors are deleted by adhoc tasks, so an unreachable vector store neither blocks nor breaks the deletion of
     * courses or course modules. Queued indexing tasks of the deleted sources become no-ops. External sources are never
     * indexed by us, so their vectors are never deleted.
     *
     * @param string $select SQL condition on local_ai_content_sources.
     * @param array $params Named parameters of the condition.
     */
    private function delete_sources(string $select, array $params): void {
        global $DB;

        $sourceidsbyvecstore = [];
        $records = $DB->get_recordset_select('local_ai_content_sources', $select, $params, 'id', 'id, sourcetype, vecstoreid');
        foreach ($records as $record) {
            // External vectors are not ours, sources not bound to a vector store have no vectors.
            if ($record->sourcetype === source::TYPE_EXTERNAL || $record->vecstoreid === null) {
                continue;
            }
            $sourceidsbyvecstore[(int) $record->vecstoreid][] = (int) $record->id;
        }
        $records->close();

        $transaction = $DB->start_delegated_transaction();
        foreach ($sourceidsbyvecstore as $vecstoreid => $sourceids) {
            foreach (array_chunk($sourceids, self::DELETE_CHUNK_SIZE) as $chunk) {
                \core\task\manager::queue_adhoc_task(delete_vectors_adhoc::instance($vecstoreid, $chunk));
            }
        }
        $sourcesubselect = "sourceid IN (SELECT id FROM {local_ai_content_sources} WHERE {$select})";
        $DB->delete_records_select('local_ai_content_ctx_sources', $sourcesubselect, $params);
        $DB->delete_records_select('local_ai_content_index', $sourcesubselect, $params);
        $DB->delete_records_select('local_ai_content_sources', $select, $params);
        $transaction->allow_commit();
    }

    /**
     * Delete the vectors of one source from the vector store it is bound to.
     *
     * Only needs the vector store, not the embedding purpose, so it also works if no embedding tool is configured.
     * Deleting is idempotent: if the source is not bound to a vector store or its collections or vectors are already
     * gone, there is nothing to delete. A deleted vector store instance unbinds its sources beforehand.
     *
     * @param source $source The source whose vectors are deleted.
     * @param ?string $model The embedding model whose vectors are deleted, null for the vectors of all embedding models.
     */
    private function delete_embeddings(source $source, ?string $model): void {
        $vecstoreid = $source->get_vecstoreid();
        if (!$vecstoreid) {
            return;
        }

        $this->delete_from_vecstore(\core\di::get(vecstore_factory::class)->get_vecstore_by_id($vecstoreid), [$source->get_id()],
            $model);
    }

    /**
     * Delete the vectors of the given sources from a vector store.
     *
     * @param base_vecstore $vecstore The vector store.
     * @param int[] $sourceids The source ids.
     * @param ?string $model The embedding model whose vectors are deleted, null for the vectors of all embedding models.
     * @throws \moodle_exception If the vector store reports an error.
     */
    private function delete_from_vecstore(base_vecstore $vecstore, array $sourceids, ?string $model = null): void {
        if (empty($sourceids)) {
            return;
        }
        $response = $vecstore->delete_embeddings($model, ...$sourceids);
        if ($response->get_code() !== 200) {
            throw new \moodle_exception('error_deleteembeddingsfailed', 'local_ai_content', '',
                $response->get_errormessage(), $response->get_debuginfo());
        }
    }
}

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
     * @param source $source The source to index.
     * @return index_state The resulting state.
     */
    public function start(source $source): index_state {
        global $USER;

        if (!$source->get_enabled()) {
            throw new \invalid_parameter_exception('Source must be enabled before indexing can be started.');
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
     * Remove all vectors of one source and reset its indexing state.
     *
     * Detaching the task id makes any queued task for this source a no-op.
     *
     * @param source $source The source to stop indexing for.
     * @return index_state The resulting state.
     */
    public function stop(source $source): index_state {
        $indexer = new indexer_manager($source->get_contextid(), new \local_ai_manager\manager('embedding'));
        $indexer->delete_source_embeddings($source);

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
     * Return the indexing state of every indexable source in the given contexts.
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
            $states[] = index_state::from_source($source)->to_array();
        }

        return $states;
    }
}






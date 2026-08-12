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

namespace local_ai_content\task;

use local_ai_content\local\indexer_manager;
use local_ai_content\source;

/**
 * Adhoc task indexing a single source.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class index_source_adhoc extends \core\task\adhoc_task {
    use \core\task\stored_progress_task_trait;

    /**
     * Execute source indexing.
     */
    public function execute(): void {
        $this->start_stored_progress();

        $sourceid = (int) ($this->get_custom_data()->sourceid ?? 0);
        if ($sourceid <= 0) {
            $this->progress->error(get_string('indexingerror_invalidsource', 'local_ai_content'));
            return;
        }

        $source = source::get_record(['id' => $sourceid]);
        if ($source === null) {
            $this->progress->error(get_string('indexingerror_missingrecord', 'local_ai_content'));
            return;
        }

        try {
            if (!$source->get_enabled() || !$source->get_allowindex()) {
                $source->set_indexstatus(source::INDEXSTATUS_IDLE);
                $source->set_indextaskid($this->get_id());
                $source->store();
                $this->progress->update_full(100, get_string('indexingstatus_idle', 'local_ai_content'));
                return;
            }

            $source->set_indexstatus(source::INDEXSTATUS_RUNNING);
            $source->store();

            $this->progress->update_full(10, get_string('indexingstatus_running', 'local_ai_content'));

            $manager = new \local_ai_manager\manager('embedding');
            $indexer = new indexer_manager($source->get_contextid(), $manager);
            $indexer->index_single_source($source);

            $source->set_indexstatus(source::INDEXSTATUS_INDEXED);
            $source->set_indextaskid($this->get_id());
            $source->store();

            $this->progress->update_full(100, get_string('indexingstatus_indexed', 'local_ai_content'));
        } catch (\Throwable $e) {
            $source->set_indexstatus(source::INDEXSTATUS_FAILED);
            $source->set_indextaskid($this->get_id());
            $source->store();
            $this->progress->error($e->getMessage());
        }
    }

    /**
     * Initial status while waiting for cron pickup.
     */
    public function set_initial_progress(): void {
        $this->progress->update_full(0, get_string('indexingstatus_queued', 'local_ai_content'));
    }

    #[\Override]
    public function retry_until_success(): bool {
        return false;
    }
}


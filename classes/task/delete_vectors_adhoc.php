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

use local_ai_content\local\index_service;

/**
 * Adhoc task deleting the vectors of deleted sources from a vector store instance.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class delete_vectors_adhoc extends \core\task\adhoc_task {
    /**
     * Factory with typed custom data.
     *
     * @param int $vecstoreid The vector store instance id holding the vectors.
     * @param int[] $sourceids The ids of the deleted sources.
     * @return self Task instance ready to be queued.
     */
    public static function instance(int $vecstoreid, array $sourceids): self {
        $task = new self();
        $task->set_custom_data(['vecstoreid' => $vecstoreid, 'sourceids' => $sourceids]);
        return $task;
    }

    #[\Override]
    public function execute(): void {
        $data = $this->get_custom_data();
        \core\di::get(index_service::class)->delete_vectors($data->vecstoreid, $data->sourceids);
    }
}

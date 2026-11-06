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
 * Adhoc task checking whether the content of an indexed source has changed and marking its outdated indexes.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class check_source_changes_adhoc extends \core\task\adhoc_task {
    /**
     * Factory with typed custom data.
     *
     * @param int $sourceid The id of the source to check.
     * @return self Task instance ready to be queued.
     */
    public static function instance(int $sourceid): self {
        $task = new self();
        $task->set_custom_data(['sourceid' => $sourceid]);
        return $task;
    }

    #[\Override]
    public function execute(): void {
        \core\di::get(index_service::class)->check_source_changes((int) $this->get_custom_data()->sourceid);
    }
}


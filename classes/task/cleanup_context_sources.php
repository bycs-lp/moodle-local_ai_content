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

use local_ai_content\context_source;

/**
 * Scheduled task removing the source selections of deleted contexts.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class cleanup_context_sources extends \core\task\scheduled_task {
    #[\Override]
    public function get_name(): string {
        return get_string('task_cleanupcontextsources', 'local_ai_content');
    }

    #[\Override]
    public function execute(): void {
        $deleted = context_source::delete_for_deleted_contexts();
        mtrace("Deleted {$deleted} source selections of deleted contexts.");
    }
}


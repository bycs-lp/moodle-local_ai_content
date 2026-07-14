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

/**
 * Scheduled task to clean up expired text extraction cache entries.
 *
 * Removes cache entries that have not been accessed within the configured
 * TTL (default: 90 days). This prevents unbounded cache growth while
 * preserving frequently used extractions.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class cleanup_cache extends \core\task\scheduled_task {
    /**
     * Get a descriptive name for this task (shown to admins).
     *
     * @return string
     */
    public function get_name(): string {
        return get_string('task_cleanupcache', 'local_ai_content');
    }

    /**
     * Execute the cache cleanup.
     *
     * Deletes cache entries where timelastaccessed is older than the configured TTL.
     */
    public function execute(): void {
        global $DB;

        $ttldays = (int) get_config('local_ai_content', 'cachettl');
        if ($ttldays <= 0) {
            $ttldays = 90;
        }

        $clock = \core\di::get(\core\clock::class);
        $cutoff = $clock->now()->getTimestamp() - ($ttldays * DAYSECS);

        $count = $DB->count_records_select(
            'local_ai_content_cache',
            'timelastaccessed < :cutoff',
            ['cutoff' => $cutoff]
        );

        if ($count > 0) {
            $DB->delete_records_select(
                'local_ai_content_cache',
                'timelastaccessed < :cutoff',
                ['cutoff' => $cutoff]
            );
            mtrace("local_ai_content: Cleaned up {$count} expired cache entries (TTL: {$ttldays} days).");
        } else {
            mtrace("local_ai_content: No expired cache entries found.");
        }
    }
}

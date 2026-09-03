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

use core\output\stored_progress_bar;
use local_ai_content\source;
use local_ai_content\task\index_source_adhoc;

/**
 * Immutable snapshot of the complete indexing state of one source.
 *
 * This is the single data object exchanged with the frontend. It is returned when indexing is started,
 * when indexing is stopped and when the frontend polls for updates.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class index_state {
    /**
     * Constructor.
     *
     * @param int $sourceid Source record id, 0 when no source record exists yet.
     * @param string $status One of the source::INDEXSTATUS_* values.
     * @param bool $allowindex Whether indexing is currently switched on.
     * @param float $percent Progress of the indexing task in percent.
     * @param string $message Progress or error message of the indexing task.
     * @param string $debuginfo Technical failure details, empty unless developer debugging is enabled.
     * @param int $lastindexed Timestamp of the last successful indexing run.
     */
    private function __construct(
        /** @var int Source record id. */
        private readonly int $sourceid,
        /** @var string Indexing status key. */
        private readonly string $status,
        /** @var bool Whether indexing is switched on. */
        private readonly bool $allowindex,
        /** @var float Task progress in percent. */
        private readonly float $percent,
        /** @var string Task progress or error message. */
        private readonly string $message,
        /** @var string Technical failure details. */
        private readonly string $debuginfo,
        /** @var int Last successful indexing timestamp. */
        private readonly int $lastindexed,
    ) {
    }

    /**
     * Build the state of an existing source record.
     *
     * @param source $source The source record.
     * @return self
     */
    public static function from_source(source $source): self {
        $status = $source->get_indexstatus();
        $progress = self::get_progress($source->get_indextaskid());
        $failed = $status === source::INDEXSTATUS_FAILED;

        return new self(
            $source->get_id(),
            $status,
            $source->get_allowindex(),
            $progress['percent'],
            // A failed run stores its message on the source record because stored progress truncates.
            $failed ? (string) $source->get_indexerror() : $progress['message'],
            $failed ? (string) $source->get_indexdebuginfo() : '',
            $source->get_lastindexed(),
        );
    }

    /**
     * Build the state of a course module that has no source record yet.
     *
     * @return self
     */
    public static function unmanaged(): self {
        return new self(0, source::INDEXSTATUS_IDLE, false, 0.0, '', '', 0);
    }

    /**
     * Whether an indexing task is currently queued or running for this source.
     *
     * @return bool
     */
    public function is_active(): bool {
        return in_array($this->status, [source::INDEXSTATUS_QUEUED, source::INDEXSTATUS_RUNNING], true);
    }

    /**
     * Convert this state into the API representation.
     *
     * @return array
     */
    public function to_array(): array {
        return [
            'sourceId' => $this->sourceid,
            'status' => $this->status,
            'statusLabel' => get_string('indexingstatus_' . $this->status, 'local_ai_content'),
            'allowIndex' => $this->allowindex,
            'percent' => $this->percent,
            'message' => $this->message,
            'debugInfo' => $this->debuginfo,
            'lastIndexedAt' => $this->lastindexed > 0 ? gmdate('c', $this->lastindexed) : null,
        ];
    }

    /**
     * Read the stored progress of an indexing task.
     *
     * @param ?int $taskid The adhoc task id the source is currently bound to.
     * @return array{percent: float, message: string}
     */
    private static function get_progress(?int $taskid): array {
        if (empty($taskid)) {
            return ['percent' => 0.0, 'message' => ''];
        }

        $idnumber = stored_progress_bar::convert_to_idnumber(index_source_adhoc::class . '_' . $taskid);
        $progressbar = stored_progress_bar::get_by_idnumber($idnumber);
        if ($progressbar === null) {
            return ['percent' => 0.0, 'message' => ''];
        }

        return [
            'percent' => $progressbar->get_percent(),
            'message' => (string) $progressbar->get_message(),
        ];
    }
}





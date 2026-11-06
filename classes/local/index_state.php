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
 * A source can be indexed with several embedding models (see {@see model_index}). The state summarizes them: a failed
 * index outweighs a running one, a running one a queued one and a queued one a completed one. The state of every
 * single embedding model is listed additionally.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class index_state {
    /** @var string The source has no index. */
    public const STATUS_IDLE = 'idle';

    /** @var string[] Index statuses ordered by their precedence when summarizing several indexes. */
    private const STATUS_PRECEDENCE = [
        model_index::STATUS_FAILED,
        model_index::STATUS_RUNNING,
        model_index::STATUS_QUEUED,
        model_index::STATUS_INDEXED,
    ];

    /**
     * Constructor.
     *
     * @param int $sourceid Source record id, 0 when no source record exists yet.
     * @param string $status Summarized status, one of the model_index::STATUS_* values or self::STATUS_IDLE.
     * @param bool $allowindex Whether indexing is currently switched on.
     * @param float $percent Progress of the indexing task of the summarizing index in percent.
     * @param string $message Progress or error message of the summarizing index.
     * @param string $debuginfo Technical failure details, empty unless developer debugging is enabled.
     * @param int $lastindexed Timestamp of the last successful indexing run of any embedding model.
     * @param array $models States of the single embedding models, see {@see self::build_model_state()}.
     * @param ?string $currentmodel Embedding model of the current user, null if the user has none.
     * @param bool $canindexcurrentmodel Whether the source can additionally be indexed with the model of the current user.
     */
    private function __construct(
        /** @var int Source record id. */
        private readonly int $sourceid,
        /** @var string Summarized status. */
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
        /** @var array States of the single embedding models. */
        private readonly array $models,
        /** @var ?string Embedding model of the current user. */
        private readonly ?string $currentmodel,
        /** @var bool Whether the source can be indexed with the model of the current user. */
        private readonly bool $canindexcurrentmodel,
    ) {
    }

    /**
     * Build the state of an existing source record.
     *
     * @param source $source The source record.
     * @param model_index[] $indexes The indexes of the source, indexed by embedding model name.
     * @param ?string $currentmodel Embedding model of the current user, null if the user has none.
     * @return self The state.
     */
    public static function from_source(source $source, array $indexes, ?string $currentmodel): self {
        $summarizing = null;
        $lastindexed = 0;
        $models = [];
        foreach ($indexes as $index) {
            $lastindexed = max($lastindexed, $index->get_lastindexed());
            $models[] = self::build_model_state($index);
            $precedence = array_search($index->get_status(), self::STATUS_PRECEDENCE, true);
            if ($summarizing === null || $precedence < array_search($summarizing->get_status(), self::STATUS_PRECEDENCE, true)) {
                $summarizing = $index;
            }
        }

        $currentindex = $currentmodel === null ? null : ($indexes[$currentmodel] ?? null);
        $canindexcurrentmodel = $source->get_allowindex() && $currentmodel !== null
            && ($currentindex === null || $currentindex->get_status() === model_index::STATUS_FAILED);

        if ($summarizing === null) {
            return new self($source->get_id(), self::STATUS_IDLE, $source->get_allowindex(), 0.0, '', '', 0, [],
                $currentmodel, $canindexcurrentmodel);
        }

        $failed = $summarizing->get_status() === model_index::STATUS_FAILED;
        $progress = self::get_progress($summarizing->get_taskid());
        return new self(
            $source->get_id(),
            $summarizing->get_status(),
            $source->get_allowindex(),
            $progress['percent'],
            // A failed run stores its message on the index record because stored progress truncates.
            $failed ? (string) $summarizing->get_error() : $progress['message'],
            $failed ? (string) $summarizing->get_debuginfo() : '',
            $lastindexed,
            $models,
            $currentmodel,
            $canindexcurrentmodel,
        );
    }

    /**
     * Build the state of a course module that has no source record yet.
     *
     * @return self The state.
     */
    public static function unmanaged(): self {
        return new self(0, self::STATUS_IDLE, false, 0.0, '', '', 0, [], null, false);
    }

    /**
     * Whether an indexing task is currently queued or running for this source.
     *
     * @return bool True if an indexing task is queued or running.
     */
    public function is_active(): bool {
        return in_array($this->status, [model_index::STATUS_QUEUED, model_index::STATUS_RUNNING], true);
    }

    /**
     * Convert this state into the API representation.
     *
     * @return array The API representation.
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
            'models' => $this->models,
            'currentModel' => $this->currentmodel,
            'canIndexCurrentModel' => $this->canindexcurrentmodel,
        ];
    }

    /**
     * Build the API representation of the state of one embedding model.
     *
     * @param model_index $index The index of the embedding model.
     * @return array The API representation.
     */
    private static function build_model_state(model_index $index): array {
        return [
            'model' => $index->get_embeddingmodel(),
            'status' => $index->get_status(),
            'statusLabel' => get_string('indexingstatus_' . $index->get_status(), 'local_ai_content'),
            'lastIndexedAt' => $index->get_lastindexed() > 0 ? gmdate('c', $index->get_lastindexed()) : null,
        ];
    }

    /**
     * Read the stored progress of an indexing task.
     *
     * @param ?int $taskid The adhoc task id the index is currently bound to.
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

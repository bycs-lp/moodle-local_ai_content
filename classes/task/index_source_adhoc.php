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

use local_ai_content\local\embedding_model_resolver;
use local_ai_content\local\indexer_manager;
use local_ai_content\local\model_index;
use local_ai_content\source;

/**
 * Adhoc task indexing a single source with one embedding model.
 *
 * The task runs as the user who started the indexing, the embedding requests are made with their AI tool. The task always
 * leaves the index in a terminal state (indexed or failed) so the frontend never has to guess what happened.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class index_source_adhoc extends \core\task\adhoc_task {
    use \core\task\stored_progress_task_trait;

    /** @var int Maximum length of a stored progress message in the core schema. */
    private const MAX_PROGRESS_MESSAGE_LENGTH = 255;

    /**
     * Execute source indexing.
     */
    public function execute(): void {
        $this->start_stored_progress();

        $data = $this->get_custom_data();
        $index = model_index::get((int) $data->sourceid, (string) $data->embeddingmodel);
        $source = source::get_record(['id' => $data->sourceid]);

        // The source or index is gone, or indexing was switched off/restarted meanwhile. This run is obsolete.
        if ($index === null || $source === null || (int) $index->get_taskid() !== (int) $this->get_id()) {
            return;
        }

        try {
            $index->set_status(model_index::STATUS_RUNNING);
            $index->set_error(null);
            $index->set_debuginfo(null);
            $index->store();
            $this->progress->update_full(10, get_string('indexingstatus_running', 'local_ai_content'));

            // The AI tool of the user may have been changed since the task has been queued.
            if (\core\di::get(embedding_model_resolver::class)->get_current_model() !== $index->get_embeddingmodel()) {
                throw new \moodle_exception('indexingerror_modelchanged', 'local_ai_content', '',
                    $index->get_embeddingmodel());
            }

            $indexer = new indexer_manager($source->get_contextid(), new \local_ai_manager\manager('embedding'));
            $indexer->index_single_source($source, $index);

            $index->set_status(model_index::STATUS_INDEXED);
            $index->store();
            $this->progress->update_full(100, get_string('indexingstatus_indexed', 'local_ai_content'));
        } catch (\Throwable $e) {
            $errormessage = trim($e->getMessage()) ?: get_string('indexingstatus_failed', 'local_ai_content');

            $index->set_status(model_index::STATUS_FAILED);
            $index->set_error($errormessage);
            $index->set_debuginfo(self::build_debug_info($e));
            $index->store();

            // Stored progress only holds a short summary, the full message lives on the index record.
            $this->progress->error(self::shorten_for_progress($errormessage));

            // Rethrow so cron marks the task as failed and writes the error to the task log.
            throw $e;
        }
    }

    /**
     * Build the technical details of a failure, which are only revealed when developer debugging is on.
     *
     * @param \Throwable $exception The caught exception.
     * @return ?string Null when debugging is disabled.
     */
    private static function build_debug_info(\Throwable $exception): ?string {
        if (!debugging('', DEBUG_DEVELOPER)) {
            return null;
        }

        $debuginfo = $exception instanceof \moodle_exception ? trim((string) $exception->debuginfo) : '';

        return trim(
            $debuginfo . "\n\n"
            . $exception->getFile() . ':' . $exception->getLine() . "\n"
            . $exception->getTraceAsString()
        );
    }

    /**
     * Reduce an error message to what fits into the core stored progress schema.
     *
     * @param string $message The full error message.
     * @return string
     */
    private static function shorten_for_progress(string $message): string {
        $message = trim(preg_replace('/\s+/u', ' ', $message));
        if (\core_text::strlen($message) > self::MAX_PROGRESS_MESSAGE_LENGTH) {
            $message = \core_text::substr($message, 0, self::MAX_PROGRESS_MESSAGE_LENGTH - 3) . '...';
        }

        return $message;
    }

    #[\Override]
    public function retry_until_success(): bool {
        return false;
    }
}

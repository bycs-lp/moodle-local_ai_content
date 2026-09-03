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
 * The task always leaves the source in a terminal state (indexed or failed) so the frontend never has to
 * guess what happened.
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

        $sourceid = (int) ($this->get_custom_data()->sourceid ?? 0);
        $source = source::get_record(['id' => $sourceid]);

        // The source is gone, or indexing was switched off/restarted meanwhile. This run is obsolete.
        if ($source === null || (int) $source->get_indextaskid() !== (int) $this->get_id()) {
            return;
        }

        try {
            $source->set_indexstatus(source::INDEXSTATUS_RUNNING);
            $source->set_indexerror(null);
            $source->set_indexdebuginfo(null);
            $source->store();
            $this->progress->update_full(10, get_string('indexingstatus_running', 'local_ai_content'));

            $indexer = new indexer_manager($source->get_contextid(), new \local_ai_manager\manager('embedding'));
            $indexer->index_single_source($source);

            $source->set_indexstatus(source::INDEXSTATUS_INDEXED);
            $source->store();
            $this->progress->update_full(100, get_string('indexingstatus_indexed', 'local_ai_content'));
        } catch (\Throwable $e) {
            $errormessage = trim($e->getMessage()) ?: get_string('indexingstatus_failed', 'local_ai_content');

            // A failed run switches indexing off so users have to explicitly requeue it.
            $source->set_allowindex(false);
            $source->set_indexstatus(source::INDEXSTATUS_FAILED);
            $source->set_indexerror($errormessage);
            $source->set_indexdebuginfo(self::build_debug_info($e));
            $source->store();

            // Stored progress only holds a short summary, the full message lives on the source record.
            $this->progress->error(self::shorten_for_progress($errormessage));
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


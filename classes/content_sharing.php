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

namespace local_ai_content;

use local_ai_content\local\source;
use local_ai_content\local\source_content_reader;

/**
 * Public API for other plugins to use the content of course modules shared with AI in the source management.
 *
 * Shared content may be read by AI features, no matter if it has been indexed for the search (RAG) as well. Callers still
 * have to check that the current user may access the course module. The counterpart for single files is
 * {@see document_extractor}.
 *
 * Obtain it via dependency injection.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class content_sharing {
    /**
     * Constructor.
     *
     * @param source_content_reader $sourcecontentreader Reader of the content of sources.
     */
    public function __construct(
        /** @var source_content_reader Reader of the content of sources. */
        private readonly source_content_reader $sourcecontentreader,
    ) {
    }

    /**
     * Whether the content of a course module has been shared with AI.
     *
     * @param int $cmid The course module id.
     * @return bool True if the course module has been shared with AI.
     */
    public function is_module_shared(int $cmid): bool {
        global $DB;

        return $DB->record_exists('local_ai_content_sources',
            ['cmid' => $cmid, 'sourcetype' => source::TYPE_MODULE, 'enabled' => 1]);
    }

    /**
     * Extract the current text content of a course module shared with AI.
     *
     * @param int $cmid The course module id.
     * @return string The extracted plain-text content.
     * @throws \moodle_exception If the course module is not shared with AI, its type is not supported or extracting fails.
     */
    public function get_module_content(int $cmid): string {
        if (!$this->is_module_shared($cmid)) {
            throw new \moodle_exception('error_modulenotshared', 'local_ai_content');
        }
        return $this->sourcecontentreader->get_module_text($cmid);
    }
}

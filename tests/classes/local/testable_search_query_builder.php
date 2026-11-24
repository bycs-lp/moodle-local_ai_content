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

namespace local_ai_content\tests\local;

use local_ai_content\local\search_query_builder;

/**
 * Search query builder with a fake AI request, recording the history passed to it.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class testable_search_query_builder extends search_query_builder {
    /** @var ?array The history passed to the last AI request, null if no AI request has been made. */
    public ?array $requestedhistory = null;

    /**
     * Constructor.
     *
     * @param string $generatedquery The query returned by the fake AI request, empty to simulate a failed request.
     */
    public function __construct(
        /** @var string The query returned by the fake AI request, empty to simulate a failed request. */
        private readonly string $generatedquery,
    ) {
    }

    #[\Override]
    protected function generate_query(string $prompt, array $history, string $component, int $contextid): string {
        $this->requestedhistory = $history;
        return $this->generatedquery;
    }
}

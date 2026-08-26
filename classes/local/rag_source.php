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

/**
 * DTO representing one RAG source reference.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class rag_source {
    /**
     * Constructor.
     */
    public function __construct(
        /** @var int Source record ID behind this reference. */
        private readonly int $sourceid,
        /** @var string Human-readable source title. */
        private readonly string $title,
        /** @var string Link to the source or chunk location. */
        private readonly string $url = '',
        /** @var string Optional locator (e.g. page/section). */
        private readonly string $locator = ''
    ) {
    }

    /**
     * Get source record id.
     *
     * @return int
     */
    public function get_sourceid(): int {
        return $this->sourceid;
    }

    /**
     * Get source title.
     *
     * @return string
     */
    public function get_title(): string {
        return $this->title;
    }

    /**
     * Get source URL.
     *
     * @return string
     */
    public function get_url(): string {
        return $this->url;
    }

    /**
     * Get source locator.
     *
     * @return string
     */
    public function get_locator(): string {
        return $this->locator;
    }

    /**
     * Export to API-safe array.
     *
     * @return array
     */
    public function to_array(): array {
        return [
            'sourceId' => $this->sourceid,
            'title' => $this->title,
            'url' => $this->url,
            'locator' => $this->locator,
        ];
    }
}

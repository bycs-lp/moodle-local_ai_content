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
 * DTO holding retrieved RAG context and source references.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class rag_result {
    /** @var string Retrieved text chunks used as grounding context. */
    protected string $retrievedtext;

    /** @var rag_source[] Sources ordered by relevance. */
    protected array $sources;

    /**
     * Constructor.
     *
     * @param string $retrievedtext Retrieved text chunks.
     * @param rag_source[] $sources Source references.
     */
    public function __construct(string $retrievedtext, array $sources = []) {
        $this->retrievedtext = $retrievedtext;
        $this->sources = $sources;
    }

    /**
     * Get the retrieved text.
     *
     * @return string
     */
    public function get_retrieved_text(): string {
        return $this->retrievedtext;
    }

    /**
     * Get source references.
     *
     * @return rag_source[]
     */
    public function get_sources(): array {
        return $this->sources;
    }

    /**
     * Whether any source references exist.
     *
     * @return bool
     */
    public function has_sources(): bool {
        return !empty($this->sources);
    }

    /**
     * Export to API-safe array.
     *
     * @return array
     */
    public function to_array(): array {
        return [
            'retrievedText' => $this->retrievedtext,
            'sources' => array_map(static fn(rag_source $source): array => $source->to_array(), $this->sources),
        ];
    }
}


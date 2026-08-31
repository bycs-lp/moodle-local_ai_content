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

/**
 * Base class for module content extractors.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
abstract class cm_content_extractor {
    /** @var string[] Text mimetypes that can be read directly from file contents. */
    protected const TEXT_MIMETYPES = ['text/plain', 'text/html', 'text/csv'];

    /** @var int Number of characters per embedding chunk. */
    protected const CHUNK_SIZE = 1000;

    /** @var int Number of characters each chunk repeats from its predecessor to preserve context. */
    protected const CHUNK_OVERLAP = 100;

    /**
     * Check whether this extractor supports the given course module.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @return bool True if this extractor can handle the module type.
     */
    abstract public function is_cm_supported(\core_course\cm_info $cm): bool;

    /**
     * Extract content from the given course module.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @return string Extracted plain-text content.
     */
    abstract public function extract(\core_course\cm_info $cm): string;

    /**
     * Split extracted content into overlapping chunks for embedding.
     *
     * Splitting is done on characters, not on bytes. Byte-based splitting would cut multi-byte UTF-8
     * sequences in half, which produces strings that cannot be JSON encoded for the embedding request.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @return string[]
     */
    public function extract_as_chunks(\core_course\cm_info $cm): array {
        $content = $this->extract($cm);

        $chunks = [];
        $start = 0;
        $contentlength = \core_text::strlen($content);
        while ($start < $contentlength) {
            $chunks[] = \core_text::substr($content, $start, self::CHUNK_SIZE);
            $start += self::CHUNK_SIZE - self::CHUNK_OVERLAP;
        }

        return $chunks;
    }

    /**
     * Normalize extracted module content to plain text.
     *
     * @param string $content Extracted content.
     * @return string
     */
    protected function format_extracted_cm_content(string $content): string {
        $content = trim($content);
        if ($content === '') {
            return '';
        }

        return html_to_text($content, 0, false);
    }

    /**
     * Extract text from a stored file using direct read or local_ai_content document extraction.
     *
     * @param \stored_file $file The file to process.
     * @param int $contextid Context id used for AI availability checks.
     * @return string
     */
    protected function extract_content_from_file(\stored_file $file, int $contextid): string {
        if (in_array($file->get_mimetype(), self::TEXT_MIMETYPES)) {
            return $file->get_content();
        }

        $extractor = \core\di::get(\local_ai_content\document_extractor::class);
        return $extractor->extract_text_from_file($file, $contextid, $file->get_userid() ?: null, 'local_ai_content');
    }
}







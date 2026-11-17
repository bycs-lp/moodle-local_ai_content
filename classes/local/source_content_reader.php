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

use local_ai_content\cm_content_extractor;

/**
 * Reads the indexable content of a source as chunks and the hash of its current content.
 *
 * Indexing and change detection both use this class, so the content hash stored on an index can be compared with the hash
 * of the current content of the source.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_content_reader {
    /** @var int Number of characters per embedding chunk. */
    public const CHUNK_SIZE = 1000;

    /** @var int Number of characters each chunk repeats from its predecessor to preserve context. */
    protected const CHUNK_OVERLAP = 100;

    /**
     * Read the current content of a module or document source as chunks.
     *
     * @param source $source The source.
     * @return string[] The trimmed, non-empty content chunks in source order.
     * @throws \moodle_exception If the content of the source cannot be read.
     */
    public function get_chunks(source $source): array {
        if ($source->get_sourcetype() === source::TYPE_MODULE) {
            [$cm, $extractor] = $this->get_module_and_extractor($source);
            $chunks = $this->split_into_chunks($extractor->extract($cm));
        } else if ($source->get_sourcetype() === source::TYPE_DOCUMENT) {
            $chunks = $this->split_into_chunks((string) $source->get_content());
        } else {
            throw new \moodle_exception('indexingerror_notsupported', 'local_ai_content');
        }

        return array_values(array_filter(array_map('trim', $chunks), static fn(string $chunk): bool => $chunk !== ''));
    }

    /**
     * Return the hash of the current content of a module or document source, used to detect content changes.
     *
     * Module sources use {@see cm_content_extractor::get_content_hash()}, which usually does not extract the content.
     *
     * @param source $source The source.
     * @return string The SHA-256 hash of the content.
     * @throws \moodle_exception If the content of the source cannot be read.
     */
    public function get_content_hash(source $source): string {
        if ($source->get_sourcetype() === source::TYPE_MODULE) {
            [$cm, $extractor] = $this->get_module_and_extractor($source);
            return $extractor->get_content_hash($cm);
        }
        if ($source->get_sourcetype() === source::TYPE_DOCUMENT) {
            return hash('sha256', (string) $source->get_content());
        }
        throw new \moodle_exception('indexingerror_notsupported', 'local_ai_content');
    }

    /**
     * Split content into overlapping chunks for embedding.
     *
     * Splitting is done on characters, not on bytes. Byte-based splitting would cut multi-byte UTF-8
     * sequences in half, which produces strings that cannot be JSON encoded for the embedding request.
     *
     * @param string $content The plain-text content.
     * @return string[] The chunks in content order.
     */
    private function split_into_chunks(string $content): array {
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
     * Resolve the course module of a module source and its content extractor.
     *
     * @param source $source The module source.
     * @return array{0: \core_course\cm_info, 1: cm_content_extractor} The course module and its extractor.
     * @throws \moodle_exception If the course module does not exist or its type is not supported.
     */
    private function get_module_and_extractor(source $source): array {
        $cmid = $source->get_cmid();
        $rawcm = get_coursemodule_from_id('', $cmid, 0, false, IGNORE_MISSING);
        if (!$rawcm) {
            throw new \moodle_exception('indexingerror_sourcenotfound', 'local_ai_content');
        }
        $cm = get_fast_modinfo($rawcm->course)->get_cm($cmid);
        $extractor = $this->get_cm_content_extractor($cm);
        if ($extractor === null) {
            throw new \moodle_exception('indexingerror_notsupported', 'local_ai_content');
        }
        return [$cm, $extractor];
    }

    /**
     * Return the content extractor class responsible for a module type.
     *
     * Content extractors are found by naming convention: local_ai_content\contentextractor\cm_content_{modname}. This
     * only checks the module type; whether a single course module is supported (e.g. the file type of a resource) is
     * decided by {@see cm_content_extractor::is_cm_supported()}.
     *
     * @param string $modname The module type, e.g. 'page'.
     * @return ?string The fully qualified class name, null if the module type has no content extractor.
     */
    public function get_extractor_class(string $modname): ?string {
        $classname = 'local_ai_content\contentextractor\cm_content_' . $modname;
        return is_subclass_of($classname, cm_content_extractor::class) ? $classname : null;
    }

    /**
     * Resolve and instantiate the content extractor for a course module.
     *
     * @param \core_course\cm_info $cm The course module.
     * @return ?cm_content_extractor The extractor, null if the module type or the course module is not supported.
     */
    private function get_cm_content_extractor(\core_course\cm_info $cm): ?cm_content_extractor {
        $classname = $this->get_extractor_class($cm->modname);
        if ($classname === null) {
            return null;
        }

        $extractor = new $classname();
        return $extractor->is_cm_supported($cm) ? $extractor : null;
    }
}


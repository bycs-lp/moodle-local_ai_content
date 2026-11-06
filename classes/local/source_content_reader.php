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
use local_ai_content\source;

/**
 * Reads the indexable content of a source as chunks and hashes it.
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
    /**
     * Read the current content of a module or document source as chunks.
     *
     * @param source $source The source.
     * @return string[] The trimmed, non-empty content chunks in source order.
     * @throws \moodle_exception If the content of the source cannot be read.
     */
    public function get_chunks(source $source): array {
        if ($source->get_sourcetype() === source::TYPE_MODULE) {
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
            $chunks = $extractor->extract_as_chunks($cm);
        } else if ($source->get_sourcetype() === source::TYPE_DOCUMENT) {
            $chunks = [(string) $source->get_content()];
        } else {
            throw new \moodle_exception('indexingerror_notsupported', 'local_ai_content');
        }

        return array_values(array_filter(array_map('trim', $chunks), static fn(string $chunk): bool => $chunk !== ''));
    }

    /**
     * Hash content chunks.
     *
     * @param string[] $chunks The content chunks as returned by {@see self::get_chunks()}.
     * @return string The SHA-256 hash of the chunks.
     */
    public function hash_chunks(array $chunks): string {
        return hash('sha256', implode("\n", $chunks));
    }

    /**
     * Resolve and instantiate the content extractor for a course module.
     *
     * @param \core_course\cm_info $cm The course module.
     * @return ?cm_content_extractor The extractor, null if the module type is not supported.
     */
    private function get_cm_content_extractor(\core_course\cm_info $cm): ?cm_content_extractor {
        $classname = 'local_ai_content\contentextractor\cm_content_' . $cm->modname;
        if (!class_exists($classname)) {
            return null;
        }

        $extractor = new $classname();
        return $extractor->is_cm_supported($cm) ? $extractor : null;
    }
}


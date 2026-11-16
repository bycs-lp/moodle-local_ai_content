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

namespace local_ai_content\contentextractor;

use local_ai_content\cm_content_extractor;

/**
 * Class cm_content_resource
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class cm_content_resource extends cm_content_extractor {
    #[\Override]
    public function is_cm_supported(\core_course\cm_info $cm): bool {
        if ($cm->modname !== 'resource') {
            return false;
        }

        $file = $this->get_main_file($cm);
        if ($file === null) {
            return false;
        }

        $extractor = \core\di::get(\local_ai_content\document_extractor::class);
        return $extractor->is_file_supported($file);
    }

    #[\Override]
    public function extract(\core_course\cm_info $cm): string {
        $file = $this->get_main_file($cm);
        if ($file === null) {
            return '';
        }

        $content = $this->extract_content_from_file($file, $cm->context->id);
        return $this->format_with_intro($cm, [$content]);
    }

    #[\Override]
    public function get_content_hash(\core_course\cm_info $cm): string {
        // Hashes the inputs of the extraction, so the change check does not extract the file.
        $file = $this->get_main_file($cm);
        if ($file === null) {
            return $this->hash_content_parts([]);
        }
        return $this->hash_content_parts([...$this->get_intro_hash_parts($cm), $this->get_file_hash_part($file)]);
    }

    /**
     * Return the main file of the resource, which is the extracted file.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @return ?\stored_file The main file, null if the resource has no file.
     */
    private function get_main_file(\core_course\cm_info $cm): ?\stored_file {
        $files = get_file_storage()->get_area_files($cm->context->id, 'mod_resource', 'content', 0,
            'sortorder DESC, id ASC', false);
        return reset($files) ?: null;
    }
}

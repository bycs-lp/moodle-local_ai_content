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
 * Class cm_content_folder
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class cm_content_folder extends cm_content_extractor {
    #[\Override]
    public function is_cm_supported(\core_course\cm_info $cm): bool {
        return $cm->modname === 'folder';
    }

    #[\Override]
    public static function get_content_change_events(): array {
        // Files can be edited on the view page of the folder outside of the settings form.
        return array_merge(parent::get_content_change_events(), [
            \mod_folder\event\folder_updated::class,
        ]);
    }

    #[\Override]
    public function extract(\core_course\cm_info $cm): string {
        $filecontents = [];
        foreach ($this->get_files($cm) as $file) {
            $filecontents[] = $this->extract_content_from_file($file, $cm->context->id);
        }

        return $this->format_with_intro($cm, $filecontents);
    }

    #[\Override]
    public function get_content_hash(\core_course\cm_info $cm): string {
        // Hashes the inputs of the extraction, so the change check does not extract the files.
        return $this->hash_content_parts([
            ...$this->get_intro_hash_parts($cm),
            ...array_map(fn(\stored_file $file): string => $this->get_file_hash_part($file), $this->get_files($cm)),
        ]);
    }

    /**
     * Return the files of the folder in extraction order.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @return \stored_file[] The files, without directories.
     */
    private function get_files(\core_course\cm_info $cm): array {
        return array_values(get_file_storage()->get_area_files($cm->context->id, 'mod_folder', 'content', 0, 'id ASC', false));
    }
}

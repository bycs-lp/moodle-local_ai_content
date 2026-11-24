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
 * Reads the structure of a course as shown on the course page, so all UIs list activities in the same order.
 *
 * Obtain it via dependency injection.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class course_structure {
    /**
     * Return the listed sections of a course with their course modules in course page order.
     *
     * Course modules of delegated sections (e.g. subsections) follow the module delegating the section, as part of the
     * section listed on the course page.
     *
     * @param \core_course\modinfo $modinfo The course module info of the course.
     * @return array{usessections: bool, sections: array<int, array{id: int, name: string, cms: \core_course\cm_info[]}>}
     *     Whether the course format uses sections and the sections with their course modules.
     */
    public function get_sections(\core_course\modinfo $modinfo): array {
        $format = course_get_format($modinfo->get_course());
        $sections = [];
        foreach ($modinfo->get_listed_section_info_all() as $section) {
            $sections[] = [
                'id' => (int) $section->id,
                'name' => $format->get_section_name($section),
                'cms' => $this->get_section_cms($section),
            ];
        }
        return ['usessections' => $format->uses_sections(), 'sections' => $sections];
    }

    /**
     * Return the course modules of a section in course page order, including the modules of delegated sections.
     *
     * @param \core_course\section_info $section The section.
     * @return \core_course\cm_info[] The course modules.
     */
    private function get_section_cms(\core_course\section_info $section): array {
        $cms = [];
        foreach ($section->get_sequence_cm_infos() as $cm) {
            $cms[] = $cm;
            $delegatedsection = $cm->get_delegated_section_info();
            if ($delegatedsection !== null) {
                array_push($cms, ...$this->get_section_cms($delegatedsection));
            }
        }
        return $cms;
    }
}


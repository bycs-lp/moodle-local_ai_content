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

use local_ai_content\source;

/**
 * Access helper for source-management operations.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_management_access {
    /**
     * Require source-management capability for the context of the given source.
     *
     * @param source $source Source to validate access for.
     */
    public function require_manage_access_for_source(source $source): void {
        require_login();

        $context = \context_helper::instance_by_id($source->get_contextid(), MUST_EXIST);
        require_capability('local/ai_content:managesources', $context);
    }
}

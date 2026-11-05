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

use core\exception\access_denied_exception;

/**
 * Access checks for REST routes.
 *
 * The router only answers response-aware exceptions with a matching status code, so these checks throw
 * {@see access_denied_exception} (HTTP 403) instead of the exceptions of require_capability() and require_login(),
 * which would end up as HTTP 500.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class route_access {
    /**
     * Require a capability for the current user.
     *
     * @param string $capability The capability name.
     * @param \context $context The context to check the capability in.
     * @throws access_denied_exception If the user does not have the capability.
     */
    public static function require_capability(string $capability, \context $context): void {
        if (!has_capability($capability, $context)) {
            throw new access_denied_exception('nopermissions', 'error', '', get_capability_string($capability));
        }
    }

    /**
     * Require that the current user may access a course (enrolment, guest access or viewing capability).
     *
     * @param \context_course $coursecontext The context of the course.
     * @throws access_denied_exception If the user may not access the course.
     */
    public static function require_course_access(\context_course $coursecontext): void {
        if (!can_access_course(get_course($coursecontext->instanceid))) {
            throw new access_denied_exception('requireloginerror', 'error');
        }
    }
}

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
 * Enforces the access rules of the plugin for the current user.
 *
 * The router only answers response-aware exceptions with a matching status code, so these checks throw
 * {@see access_denied_exception} (HTTP 403) instead of the exceptions of require_capability() and require_login(),
 * which would end up as HTTP 500. Whether a user may retrieve from a source is decided by {@see source_access}.
 *
 * Obtain it via dependency injection.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class access_guard {
    /** @var string Capability to manage the sources of a context. */
    private const CAP_MANAGESOURCES = 'local/ai_content:managesources';

    /**
     * Require a capability for the current user.
     *
     * @param string $capability The capability name.
     * @param \context $context The context to check the capability in.
     * @throws access_denied_exception If the user does not have the capability.
     */
    public function require_capability(string $capability, \context $context): void {
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
    public function require_course_access(\context_course $coursecontext): void {
        if (!can_access_course(get_course($coursecontext->instanceid))) {
            throw new access_denied_exception('requireloginerror', 'error');
        }
    }

    /**
     * Require login and, inside a course, course access and the capability to use sources.
     *
     * Also sets the page context, because the responses contain output rendered with the theme of the page
     * (e.g. activity icon URLs).
     *
     * @param \context $context The context the sources are used in.
     */
    public function require_use_access(\context $context): void {
        global $PAGE;
        require_login();

        $coursecontext = $context->get_course_context(false);
        if ($coursecontext !== false) {
            $this->require_capability('local/ai_content:usesource', $coursecontext);
            $this->require_course_access($coursecontext);
        }
        $PAGE->set_context($context);
    }

    /**
     * Require login and the capability to manage the sources of the course the given context belongs to.
     *
     * @param \context $context The active context.
     * @return \context_course The context of the course whose sources are managed.
     * @throws access_denied_exception If the context does not belong to a course.
     */
    public function require_manage_access(\context $context): \context_course {
        require_login();
        $coursecontext = $context->get_course_context(false);
        if (!$coursecontext) {
            throw new access_denied_exception('nopermissions', 'error', '', get_capability_string(self::CAP_MANAGESOURCES));
        }
        $this->require_capability(self::CAP_MANAGESOURCES, $coursecontext);
        return $coursecontext;
    }

    /**
     * Whether the current user may manage the global sources (system context).
     *
     * @return bool True if the user may manage the global sources.
     */
    public function can_manage_global_sources(): bool {
        return has_capability(self::CAP_MANAGESOURCES, \context_system::instance());
    }

    /**
     * Require the capability to manage the global sources (system context).
     */
    public function require_manage_global_sources(): void {
        $this->require_capability(self::CAP_MANAGESOURCES, \context_system::instance());
    }

    /**
     * Require the course management access and resolve all context ids whose sources the current user may manage.
     *
     * @param \context $context The active context.
     * @return int[] Context ids: the course context and, if the user may manage global sources, the system context.
     */
    public function get_managed_contextids(\context $context): array {
        $contextids = [$this->require_manage_access($context)->id];
        if ($this->can_manage_global_sources()) {
            $contextids[] = SYSCONTEXTID;
        }
        return $contextids;
    }

    /**
     * Require the permission to manage a document source from the source management of a course.
     *
     * Global documents need the capability in the system context, course documents have to belong to the course.
     *
     * @param \context_course $coursecontext The context of the course whose sources are managed.
     * @param source $source The document source.
     * @throws access_denied_exception If the source belongs to another course.
     */
    public function require_document_manage_access(\context_course $coursecontext, source $source): void {
        if ($source->get_contextid() === SYSCONTEXTID) {
            $this->require_manage_global_sources();
            return;
        }

        if ($source->get_contextid() !== $coursecontext->id) {
            throw new access_denied_exception('nopermissions', 'error', '', get_capability_string(self::CAP_MANAGESOURCES));
        }
    }

    /**
     * Require login and the capability to manage sources in the context of the given source.
     *
     * @param source $source Source to validate access for.
     */
    public function require_manage_access_for_source(source $source): void {
        require_login();

        $context = \context_helper::instance_by_id($source->get_contextid(), MUST_EXIST);
        $this->require_capability(self::CAP_MANAGESOURCES, $context);
    }
}


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
 * Access control utility for RAG sources.
 *
 * Determines which sources a user is actually allowed to retrieve from, so that a similarity search can be
 * restricted to permitted sources by their record id alone (the vector store payload no longer carries a
 * context id). Access is decided per source type:
 *  - Module sources: the related activity must be visible to the user (respecting availability restrictions and
 *    course/section visibility) and the user must hold the activity's view capability where the module defines one.
 *  - Document and external sources: the user must hold the local/ai_content:usesource capability in the context
 *    the source is attached to.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_access {

    /**
     * Filters a list of source ids down to those the given user is allowed to retrieve from for RAG.
     *
     * @param int[] $sourceids the source record ids to check
     * @param ?int $userid the user to check access for, or null for the current user
     * @return int[] the subset of source ids the user may retrieve from
     */
    public static function filter_accessible_sourceids(array $sourceids, ?int $userid = null): array {
        $sourceids = array_values(array_unique(array_filter(array_map('intval', $sourceids))));
        if (empty($sourceids)) {
            return [];
        }
        $userid = self::resolve_userid($userid);
        $sources = source::get_records_by_ids($sourceids);
        $accessible = [];
        foreach ($sources as $source) {
            if (self::can_access_source($source, $userid)) {
                $accessible[] = $source->get_id();
            }
        }
        return $accessible;
    }

    /**
     * Whether the given user may retrieve from a single source.
     *
     * @param source $source the source to check
     * @param ?int $userid the user to check access for, or null for the current user
     * @return bool true if the user may retrieve from the source
     */
    public static function can_access_source(source $source, ?int $userid = null): bool {
        $userid = self::resolve_userid($userid);
        if ($source->get_sourcetype() === source::TYPE_MODULE) {
            return self::user_can_access_module_source($source, $userid);
        }
        return self::user_can_access_context_source($source, $userid);
    }

    /**
     * Whether the user may retrieve from a module source.
     *
     * The related activity must be visible to the user (which already accounts for availability restrictions and
     * course/section visibility) and, where the module defines a view capability, the user must hold it.
     *
     * @param source $source the module source to check
     * @param int $userid the user to check access for
     * @return bool true if the user may retrieve from the module source
     */
    protected static function user_can_access_module_source(source $source, int $userid): bool {
        $cmid = $source->get_cmid();
        if (empty($cmid)) {
            return false;
        }
        $cmrecord = get_coursemodule_from_id('', $cmid, 0, false, IGNORE_MISSING);
        if (!$cmrecord) {
            return false;
        }
        $modinfo = get_fast_modinfo($cmrecord->course, $userid);
        $cms = $modinfo->get_cms();
        if (!isset($cms[$cmid])) {
            return false;
        }
        $cminfo = $cms[$cmid];
        // uservisible respects course/section visibility and availability restrictions for this user.
        if (!$cminfo->uservisible) {
            return false;
        }
        // Additionally require the activity's view capability, but only for modules that define one.
        $viewcapability = 'mod/' . $cminfo->modname . ':view';
        if (get_capability_info($viewcapability) !== null
                && !has_capability($viewcapability, $cminfo->context, $userid)) {
            return false;
        }
        return true;
    }

    /**
     * Whether the user holds the usesource capability in the context a non-module source is attached to.
     *
     * @param source $source the document or external source to check
     * @param int $userid the user to check access for
     * @return bool true if the user may retrieve from the source
     */
    protected static function user_can_access_context_source(source $source, int $userid): bool {
        $contextid = $source->get_contextid();
        if (empty($contextid)) {
            return false;
        }
        try {
            $context = \context_helper::instance_by_id($contextid);
        } catch (\moodle_exception $e) {
            return false;
        }
        return has_capability('local/ai_content:usesource', $context, $userid);
    }

    /**
     * Resolves the user id to check access for, defaulting to the current user.
     *
     * @param ?int $userid the given user id, or null for the current user
     * @return int the resolved user id
     */
    protected static function resolve_userid(?int $userid): int {
        global $USER;
        return $userid ?? (int) $USER->id;
    }
}

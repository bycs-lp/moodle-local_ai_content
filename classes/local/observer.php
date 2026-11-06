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
 * Event observers for local_ai_content.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class observer {
    /**
     * Delete the source of a deleted course module.
     *
     * @param \core\event\course_module_deleted $event The event.
     */
    public static function course_module_deleted(\core\event\course_module_deleted $event): void {
        \core\di::get(index_service::class)->delete_module_source($event->objectid);
    }

    /**
     * Queue the check for content changes of the source of the course module the event has been triggered for.
     *
     * Registered for the events returned by {@see \local_ai_content\cm_content_extractor::get_content_change_events()}.
     *
     * @param \core\event\base $event The event signalling a possible content change.
     */
    public static function module_content_changed(\core\event\base $event): void {
        // The course module is taken from the event context, events in other contexts cannot be mapped to a module.
        if ((int) $event->contextlevel !== CONTEXT_MODULE) {
            return;
        }
        \core\di::get(index_service::class)->queue_module_change_check((int) $event->contextinstanceid);
    }

    /**
     * Build the observer definitions for the content change events of all content extractors.
     *
     * Used by db/events.php.
     *
     * @return array[] Observer definitions in the format of db/events.php.
     */
    public static function get_content_change_observers(): array {
        $events = [];
        $classes = \core_component::get_component_classes_in_namespace('local_ai_content', 'contentextractor');
        foreach (array_keys($classes) as $classname) {
            if (is_subclass_of($classname, \local_ai_content\cm_content_extractor::class)) {
                $events = array_merge($events, $classname::get_content_change_events());
            }
        }

        return array_map(
            static fn(string $eventname): array => [
                'eventname' => '\\' . ltrim($eventname, '\\'),
                'callback' => '\\' . self::class . '::module_content_changed',
            ],
            array_values(array_unique($events)),
        );
    }
}

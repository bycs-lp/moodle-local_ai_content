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

use core\hook\di_configuration;
use local_ai_content\local\backend\ai_backend;
use local_ai_content\local\backend\config;
use local_ai_manager\hook\before_primary_vecstore_changed;
use local_ai_manager\hook\before_vecstore_instance_deleted;
use local_ai_manager\hook\vecstore_usage;

/**
 * Hook callbacks for local_ai_content.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class hook_callbacks {
    /**
     * Configure DI container with the appropriate AI backend implementation.
     *
     * Delegates backend instantiation to the config class which maintains
     * the mapping between setting values and backend implementations.
     *
     * @param di_configuration $hook The DI configuration hook.
     */
    public static function configure_di(di_configuration $hook): void {
        $hook->add_definition(
            id: ai_backend::class,
            definition: fn() => config::create_backend(),
        );
    }

    /**
     * Report the sources depending on a vector store instance.
     *
     * @param vecstore_usage $hook The hook.
     */
    public static function vecstore_usage(vecstore_usage $hook): void {
        $usage = \core\di::get(index_service::class)->get_vecstore_usage($hook->instance->get_id());
        if ($usage['sources'] > 0) {
            $hook->add_usage_description('local_ai_content',
                get_string('vecstoreusage_sources', 'local_ai_content', $usage['sources']));
        }
        if ($hook->deleting && $usage['externalsources'] > 0) {
            $hook->add_usage_description('local_ai_content',
                get_string('vecstoreusage_externalsources', 'local_ai_content', $usage['externalsources']));
        }
    }

    /**
     * Detach all sources from a vector store instance before it is deleted.
     *
     * @param before_vecstore_instance_deleted $hook The hook.
     */
    public static function before_vecstore_instance_deleted(before_vecstore_instance_deleted $hook): void {
        \core\di::get(index_service::class)->release_vecstore($hook->instance->get_id(), $hook->deletevectors, true);
    }

    /**
     * Detach the indexed sources from the old primary vector store instance, so they are indexed in the new one.
     *
     * @param before_primary_vecstore_changed $hook The hook.
     */
    public static function before_primary_vecstore_changed(before_primary_vecstore_changed $hook): void {
        \core\di::get(index_service::class)->release_vecstore($hook->oldprimary->get_id(), $hook->deletevectors, false);
    }
}

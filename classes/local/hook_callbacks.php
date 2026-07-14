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
     * Reads the 'backend' setting and registers the corresponding ai_backend
     * implementation in the DI container. Defaults to local_ai_manager if no
     * setting is configured.
     *
     * @param di_configuration $hook The DI configuration hook.
     */
    public static function configure_di(di_configuration $hook): void {
        $hook->add_definition(
            id: ai_backend::class,
            definition: function (): ai_backend {
                $backend = get_config('local_ai_content', 'backend') ?: 'local_ai_manager';
                if ($backend === 'core_ai_subsystem') {
                    return new core_ai_backend();
                }
                return new local_ai_manager_backend();
            },
        );
    }
}

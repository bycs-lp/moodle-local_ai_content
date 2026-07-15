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
use local_ai_content\backend\ai_backend;
use local_ai_content\backend\config;

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
}

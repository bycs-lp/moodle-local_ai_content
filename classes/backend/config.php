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

namespace local_ai_content\backend;

/**
 * Central configuration and factory for AI backend implementations.
 *
 * Provides the mapping between admin setting values and backend classes,
 * the options for the admin settings dropdown, and the factory method
 * to instantiate the configured backend.
 *
 * To add a new backend:
 * 1. Create a class in classes/backend/ implementing ai_backend.
 * 2. Add an entry to the BACKENDS constant below.
 * 3. Add a language string 'backend_<key>' in lang/en/local_ai_content.php.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class config {
    /** @var string Default backend setting key. */
    public const DEFAULT_BACKEND = 'local_ai_manager';

    /**
     * Mapping of admin setting values to backend implementation classes.
     *
     * Each key corresponds to the value stored in 'local_ai_content/backend'.
     * Each value is the fully qualified class name of an ai_backend implementation.
     */
    private const BACKENDS = [
        'local_ai_manager' => local_ai_manager_backend::class,
        'core_ai_subsystem' => core_ai_backend::class,
    ];

    /**
     * Get available backend options for the admin settings dropdown.
     *
     * Filters out backends whose required dependencies are not installed.
     * Returns an associative array suitable for admin_setting_configselect.
     *
     * @return array<string, string> Setting value => display name.
     */
    public static function get_backend_options(): array {
        $options = [];
        foreach (self::BACKENDS as $key => $classname) {
            if (self::is_backend_available($key)) {
                $options[$key] = get_string('backend_' . $key, 'local_ai_content');
            }
        }
        return $options;
    }

    /**
     * Create an instance of the configured AI backend.
     *
     * Reads the 'backend' setting and instantiates the corresponding class.
     * Throws an exception if the configured backend is not available.
     *
     * @return ai_backend The configured backend instance.
     * @throws \moodle_exception If the configured backend is not available.
     */
    public static function create_backend(): ai_backend {
        $setting = get_config('local_ai_content', 'backend') ?: self::DEFAULT_BACKEND;

        if (!isset(self::BACKENDS[$setting]) || !self::is_backend_available($setting)) {
            throw new \moodle_exception('error_ainotavailable', 'local_ai_content');
        }

        $classname = self::BACKENDS[$setting];
        return new $classname();
    }

    /**
     * Check if a backend's dependencies are available.
     *
     * @param string $key The backend setting key.
     * @return bool True if the backend can be used.
     */
    private static function is_backend_available(string $key): bool {
        switch ($key) {
            case 'core_ai_subsystem':
                return class_exists(\core_ai\manager::class);
            case 'local_ai_manager':
                return class_exists(\local_ai_manager\manager::class);
            default:
                // Unknown backends are available if their class exists.
                $classname = self::BACKENDS[$key] ?? null;
                return $classname !== null && class_exists($classname);
        }
    }
}

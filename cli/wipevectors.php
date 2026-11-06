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

/**
 * CLI script that deletes all collections of the primary vector store available to the admin user.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');

// Run as the admin user so the tenant configuration of the primary vector store is resolved for them.
\core\session\manager::set_user(get_admin());

// Retrieve the primary vector store driver configured for the current (admin) user.
$vecstore = \core\di::get(\local_ai_manager\local\vecstore_factory::class)->get_primary_vecstore();

foreach ($vecstore->get_collections() as $model => $collection) {
    $vecstore->drop_collection($model);
    cli_writeln('Collection "' . $collection . '" of model "' . $model . '" deleted');
}

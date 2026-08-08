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
 * CLI script that performs a chat request (purpose "chat") with selected source ids and prints the result.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');

// Run as the admin user so the tenant configuration is resolved for them.
\core\session\manager::set_user(get_admin());

$prompttext = 'Gibt es irgendwas mit BLABLA';
$context = \core\context\system::instance();

$manager = new \local_ai_manager\manager('chat');
$response = $manager->perform_request(
    $prompttext,
    'local_ai_content',
    $context->id,
    ['sourceids' => '1,2,3,4']
);

if ($response->get_code() !== 200) {
    cli_writeln('Request failed (HTTP ' . $response->get_code() . '): ' . $response->get_errormessage());
    $debuginfo = $response->get_debuginfo();
    if ($debuginfo !== '') {
        cli_writeln('Debug info: ' . $debuginfo);
    }
    exit(1);
}

cli_heading('Chat response');
cli_writeln($response->get_content());

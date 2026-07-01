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
 * TODO describe file test
 *
 * @package    local_ai_content
 * @copyright  2026 YOUR NAME <your@email.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);

require(__DIR__.'../../../../config.php');
require_once($CFG->libdir.'/clilib.php');

$course = get_course(37);
$context = \context_course::instance($course->id);
// TODO Set up a user to run the indexing as. For now, we'll just use the admin user.
\core\session\manager::set_user(get_admin());

$aimanager = new \local_ai_manager\manager('embedding');

$index = new \local_ai_content\local\indexer_manager($context->id, $aimanager);

$index->index();

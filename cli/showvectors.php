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
 * CLI script that lists all vectors currently stored in the primary vector store available to the admin user.
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

// Retrieve the primary vector store driver configured for the current (admin) user via the connector factory.
$vecstore = \core\di::get(\local_ai_manager\local\connector_factory::class)->get_primary_vecstore();
if (is_null($vecstore)) {
    cli_error('No primary vector store is configured for the current user.');
}

$collection = $vecstore->get_collection();
if (empty($collection)) {
    cli_error('The primary vector store instance has no collection configured.');
}

cli_heading('Vectors in vector store "' . $vecstore->get_name() . '" (collection: ' . $collection . ')');

$allvectorsresponse = $vecstore->get_all();
if ($allvectorsresponse->get_code() !== 200) {
    cli_error('Could not fetch vectors: ' . $allvectorsresponse->get_errormessage());
}
$queryresponse = $allvectorsresponse->get_queryresponse();
if (is_null($queryresponse)) {
    cli_error('Could not fetch vectors: Missing query payload in vecstore response.');
}
$vectors = $queryresponse->get_matches();
if (empty($vectors)) {
    cli_writeln('No vectors found.');
    exit(0);
}

foreach ($vectors as $index => $vector) {
    $dimensions = count(array_filter((array) json_decode($vector->get_vector(), true), 'is_numeric'));
    cli_writeln('----------------------------------------');
    cli_writeln('Vector #' . ($index + 1));
    cli_writeln('  Source id  : ' . $vector->get_sourceid());
    cli_writeln('  Chunk      : ' . ($vector->get_chunk()) . ' / ' . $vector->get_maxchunks());
    cli_writeln('  Dimensions : ' . $dimensions);
    cli_writeln('  Content    : ' . shorten_text($vector->get_content(), 200));
}
cli_writeln('----------------------------------------');
cli_writeln('Total: ' . count($vectors) . ' vector(s).');




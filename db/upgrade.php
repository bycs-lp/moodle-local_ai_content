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
 * Upgrade steps for local_ai_content.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Execute local_ai_content upgrade from the given old version.
 *
 * @param int $oldversion The currently installed plugin version.
 * @return bool Always true on success.
 */
function xmldb_local_ai_content_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();

    if ($oldversion < 2026072200) {
        // Drop the usage log table — no longer needed.
        $table = new xmldb_table('local_ai_content_usage');
        if ($dbman->table_exists($table)) {
            $dbman->drop_table($table);
        }

        upgrade_plugin_savepoint(true, 2026072200, 'local', 'ai_content');
    }

    if ($oldversion < 2026072201) {
        // Add cachehit field to the cache table.
        $table = new xmldb_table('local_ai_content_cache');
        $field = new xmldb_field('cachehit', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0', 'extractedcontent');

        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        upgrade_plugin_savepoint(true, 2026072201, 'local', 'ai_content');
    }

    if ($oldversion < 2026082700) {
        // Add source indexing status and adhoc task tracking fields.
        $table = new xmldb_table('local_ai_content_sources');

        $indexstatus = new xmldb_field('indexstatus', XMLDB_TYPE_CHAR, '20', null, XMLDB_NOTNULL, null, 'idle', 'lastindexed');
        if (!$dbman->field_exists($table, $indexstatus)) {
            $dbman->add_field($table, $indexstatus);
        }

        $indextaskid = new xmldb_field('indextaskid', XMLDB_TYPE_INTEGER, '10', null, null, null, null, 'indexstatus');
        if (!$dbman->field_exists($table, $indextaskid)) {
            $dbman->add_field($table, $indextaskid);
        }

        upgrade_plugin_savepoint(true, 2026082700, 'local', 'ai_content');
    }

    if ($oldversion < 2026083100) {
        // Store the full error message of a failed indexing run, which does not fit into stored progress.
        $table = new xmldb_table('local_ai_content_sources');
        $indexerror = new xmldb_field('indexerror', XMLDB_TYPE_TEXT, null, null, null, null, null, 'indextaskid');
        if (!$dbman->field_exists($table, $indexerror)) {
            $dbman->add_field($table, $indexerror);
        }

        upgrade_plugin_savepoint(true, 2026083100, 'local', 'ai_content');
    }

    if ($oldversion < 2026083101) {
        // Keep the technical failure details separate from the message shown to source managers.
        $table = new xmldb_table('local_ai_content_sources');
        $indexdebuginfo = new xmldb_field('indexdebuginfo', XMLDB_TYPE_TEXT, null, null, null, null, null, 'indexerror');
        if (!$dbman->field_exists($table, $indexdebuginfo)) {
            $dbman->add_field($table, $indexdebuginfo);
        }

        upgrade_plugin_savepoint(true, 2026083101, 'local', 'ai_content');
    }

    return true;
}

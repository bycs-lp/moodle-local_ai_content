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
 * Upgrade steps for AI Content Manager.
 *
 * Documentation: {@link https://moodledev.io/docs/guides/upgrade}
 *
 * @package    local_ai_content
 * @category   upgrade
 * @copyright  2026 YOUR NAME <your@email.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Execute the plugin upgrade steps from the given old version.
 *
 * @param int $oldversion
 * @return bool
 */
function xmldb_local_ai_content_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();
    $legacysourceidsfield = 'rag' . 'recordids';

    if ($oldversion < 2026070100) {
        // Add local_ai_content_ragselection table.
        $table = new \xmldb_table('local_ai_content_ragselection');

        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('contextid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field($legacysourceidsfield, XMLDB_TYPE_TEXT, null, null, null, null, null);
        $table->add_field('usermodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('contextid', XMLDB_KEY_UNIQUE, ['contextid']);
        $table->add_key('usermodified', XMLDB_KEY_FOREIGN, ['usermodified'], 'user', ['id']);

        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2026070100, 'local', 'ai_content');
    }

    if ($oldversion < 2026070101) {
        $oldtable = new \xmldb_table('local_ai_content_ragcontext');
        $newtable = new \xmldb_table('local_ai_content_ragselection');

        if ($dbman->table_exists($oldtable) && !$dbman->table_exists($newtable)) {
            $dbman->rename_table($oldtable, 'local_ai_content_ragselection');
        }

        upgrade_plugin_savepoint(true, 2026070101, 'local', 'ai_content');
    }

    if ($oldversion < 2026070800) {
        // Rename source table from old config name.
        $configtable = new \xmldb_table('local_ai_content_config');
        $sourcetable = new \xmldb_table('local_ai_content_sources');
        if ($dbman->table_exists($configtable) && !$dbman->table_exists($sourcetable)) {
            $dbman->rename_table($configtable, 'local_ai_content_sources');
        }

        // Make sure local_ai_content_sources contains all required fields.
        $sourcetable = new \xmldb_table('local_ai_content_sources');
        if ($dbman->table_exists($sourcetable)) {
            $field = new \xmldb_field('sourcetype', XMLDB_TYPE_CHAR, '50', null, XMLDB_NOTNULL, null, 'module', 'contextid');
            if (!$dbman->field_exists($sourcetable, $field)) {
                $dbman->add_field($sourcetable, $field);
            }

            $field = new \xmldb_field('name', XMLDB_TYPE_CHAR, '255', null, null, null, null, 'sourcetype');
            if (!$dbman->field_exists($sourcetable, $field)) {
                $dbman->add_field($sourcetable, $field);
            }

            $field = new \xmldb_field('content', XMLDB_TYPE_TEXT, null, null, null, null, null, 'name');
            if (!$dbman->field_exists($sourcetable, $field)) {
                $dbman->add_field($sourcetable, $field);
            }

            $field = new \xmldb_field('rag', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '1', 'content');
            if (!$dbman->field_exists($sourcetable, $field)) {
                $dbman->add_field($sourcetable, $field);
            }

            $index = new \xmldb_index('cmid', XMLDB_INDEX_NOTUNIQUE, ['cmid']);
            if (!$dbman->index_exists($sourcetable, $index)) {
                $dbman->add_index($sourcetable, $index);
            }
        }

        // Rename selection table to sourceselection.
        $ragselectiontable = new \xmldb_table('local_ai_content_ragselection');
        $sourceselectiontable = new \xmldb_table('local_ai_content_sourceselection');
        if ($dbman->table_exists($ragselectiontable) && !$dbman->table_exists($sourceselectiontable)) {
            $dbman->rename_table($ragselectiontable, 'local_ai_content_sourceselection');
        }

        // Rename legacy selected-source field to sourceids.
        $sourceselectiontable = new \xmldb_table('local_ai_content_sourceselection');
        if ($dbman->table_exists($sourceselectiontable)) {
            $field = new \xmldb_field($legacysourceidsfield, XMLDB_TYPE_TEXT, null, null, null, null, null);
            if ($dbman->field_exists($sourceselectiontable, $field)) {
                $dbman->rename_field($sourceselectiontable, $field, 'sourceids');
            }
        }

        upgrade_plugin_savepoint(true, 2026070800, 'local', 'ai_content');
    }

    return true;
}

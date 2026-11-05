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
 * Data generator for local_ai_content plugin.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class local_ai_content_generator extends testing_module_generator {
    /**
     * Create a cache record in the local_ai_content_cache table.
     *
     * @param array $record Optional overrides for the record fields.
     *   - contenthash (string): SHA1 hash, defaults to random.
     *   - extractedcontent (string): Extracted text, defaults to lorem ipsum.
     *   - timecreated (int): Creation timestamp, defaults to now.
     *   - timemodified (int): Modification timestamp, defaults to now.
     *   - timelastaccessed (int): Last accessed timestamp, defaults to now.
     * @return stdClass The inserted database record with id.
     */
    public function create_cache_record(array $record = []): stdClass {
        global $DB;

        $now = time();
        $defaults = [
            'contenthash' => sha1(random_string(20)),
            'extractedcontent' => 'Generated test content ' . random_string(10),
            'timecreated' => $now,
            'timemodified' => $now,
            'timelastaccessed' => $now,
        ];

        $record = array_merge($defaults, $record);
        $obj = (object) $record;
        $obj->id = $DB->insert_record('local_ai_content_cache', $obj);
        return $obj;
    }

    /**
     * Create a source in the local_ai_content_sources table.
     *
     * @param array $record Source fields.
     *   - contextid (int): Context the source is attached to, required.
     *   - sourcetype (string): One of source::TYPE_*, defaults to document.
     *   - cmid (int): Course module id of module sources, defaults to null.
     *   - vecstoreid (int): Vector store instance id holding the vectors, defaults to null (not indexed).
     *   - name (string): Source name, defaults to a generated name.
     * @return \local_ai_content\source The stored source.
     */
    public function create_source(array $record): \local_ai_content\source {
        $source = new \local_ai_content\source();
        $source->set_contextid($record['contextid']);
        $source->set_sourcetype($record['sourcetype'] ?? \local_ai_content\source::TYPE_DOCUMENT);
        $source->set_cmid($record['cmid'] ?? null);
        $source->set_vecstoreid($record['vecstoreid'] ?? null);
        $source->set_name($record['name'] ?? 'Test source ' . random_string(5));
        $source->store();
        return $source;
    }
}

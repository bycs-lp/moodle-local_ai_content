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

namespace local_ai_content\privacy;

use core_privacy\local\metadata\collection;

/**
 * Privacy provider for local_ai_content.
 *
 * The plugin caches the extracted text of processed files by content hash. The cache has no user
 * reference and is cleaned up when the underlying file is deleted.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements \core_privacy\local\metadata\provider {
    /**
     * Describe the data stored by this plugin.
     *
     * @param collection $collection The collection to add the metadata to.
     * @return collection The updated collection.
     */
    public static function get_metadata(collection $collection): collection {
        return $collection->add_database_table('local_ai_content_cache', [
            'contenthash' => 'privacy:metadata:cache:contenthash',
            'extractedcontent' => 'privacy:metadata:cache:extractedcontent',
            'timecreated' => 'privacy:metadata:cache:timecreated',
        ], 'privacy:metadata:cache');
    }
}

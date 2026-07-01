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

namespace local_ai_content\persistent;

use core\persistent;

/**
 * Persistent class for the local_ai_content_ragselection table.
 *
 * Stores the comma-separated list of local_ai_content_config record IDs that are
 * selected as RAG sources for a given context.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class ragselection extends persistent {

    /** @var string Table name. */
    const TABLE = 'local_ai_content_ragselection';

    /**
     * Define the properties of this model.
     *
     * @return array
     */
    protected static function define_properties(): array {
        return [
            'contextid' => [
                'type' => PARAM_INT,
                'description' => 'The Moodle context ID this RAG selection applies to.',
            ],
            'ragrecordids' => [
                'type' => PARAM_TEXT,
                'description' => 'Comma-separated list of local_ai_content_config record IDs.',
                'null' => NULL_ALLOWED,
                'default' => null,
            ],
        ];
    }
}



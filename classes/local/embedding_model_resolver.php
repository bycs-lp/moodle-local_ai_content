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

namespace local_ai_content\local;

use local_ai_manager\local\connector_factory;
use local_ai_manager\local\userinfo;

/**
 * Resolves the embedding model of the current user.
 *
 * Sources are indexed with the embedding model of the user starting the indexing and can only be searched with the same
 * embedding model. The embedding model is the model of the AI tool the tenant of the user assigned to the purpose
 * "embedding" for the role of the user.
 *
 * Obtain it via dependency injection (constructor injection or {@see \core\di::get()}).
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class embedding_model_resolver {
    /**
     * Return the name of the embedding model of the current user.
     *
     * @return ?string The model name, null if the user has no AI tool with a model for the purpose "embedding".
     */
    public function get_current_model(): ?string {
        global $USER;

        $role = (new userinfo((int) $USER->id))->get_role();
        $instance = \core\di::get(connector_factory::class)->get_connector_instance_by_purpose('embedding', $role);
        $model = $instance?->get_model_name();
        return empty($model) ? null : $model;
    }
}

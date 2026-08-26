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
 * Global in-memory source-selection manager shared between legacy AMD and React UI.
 *
 * @module     local_ai_content/sources_selection_data_manager
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const MANAGER_KEY = 'sourcesSelectionDataManager';

const normalizeSourceIds = (sourceids) => {
    if (Array.isArray(sourceids)) {
        return sourceids
            .map((id) => parseInt(id, 10))
            .filter((id) => !isNaN(id) && id > 0);
    }

    if (typeof sourceids === 'string') {
        return sourceids
            .split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id) && id > 0);
    }

    return [];
};

const ensureManager = () => {
    const scope = window;
    const existing = scope[MANAGER_KEY];
    if (
        existing
        && typeof existing.setSelectedSourceIdsForContext === 'function'
        && typeof existing.getSelectedSourceIdsForContext === 'function'
    ) {
        return existing;
    }

    const contextcache = new Map();
    const manager = {
        setSelectedSourceIdsForContext(contextid, sourceids) {
            const normalizedcontextid = parseInt(contextid, 10);
            if (isNaN(normalizedcontextid) || normalizedcontextid <= 0) {
                return;
            }
            contextcache.set(normalizedcontextid, normalizeSourceIds(sourceids));
        },

        getSelectedSourceIdsForContext(contextid) {
            const normalizedcontextid = parseInt(contextid, 10);
            if (isNaN(normalizedcontextid) || normalizedcontextid <= 0) {
                return [];
            }
            return contextcache.get(normalizedcontextid) ?? [];
        },
    };

    scope[MANAGER_KEY] = manager;
    return manager;
};

export const setSelectedSourceIdsForContext = (contextid, sourceids) => {
    ensureManager().setSelectedSourceIdsForContext(contextid, sourceids);
};

export const getSelectedSourceIdsForContext = (contextid) => {
    return ensureManager().getSelectedSourceIdsForContext(contextid);
};

// Ensure the global manager exists immediately when the module is loaded.
ensureManager();


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
 * AMD access to the source selection data manager for frontends not using ESM/React.
 *
 * Thin wrapper around the ESM module @moodle/lms/local_ai_content/source_selector/data_manager, so AMD and
 * ESM consumers share the same state.
 *
 * @module     local_ai_content/source_selector
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import DataManager from 'core/esm!@moodle/lms/local_ai_content/source_selector/data_manager';

/**
 * Load the available sources and the selected source ids of a context.
 *
 * @param {number} contextid The context id
 * @param {boolean} reload Whether to bypass the cache
 * @returns {Promise<Object>} The source selection of the context
 */
export const loadSourceSelection = (contextid, reload = false) =>
    DataManager.loadSourceSelection(Number(contextid), reload);

/**
 * Get the currently selected source ids of a context, loading them first if necessary.
 *
 * @param {number} contextid The context id
 * @returns {Promise<number[]>} The selected source ids
 */
export const getSelectedSourceIds = (contextid) => DataManager.getSelectedSourceIds(Number(contextid));

/**
 * Persist the selected source ids of a context.
 *
 * @param {number} contextid The context id
 * @param {number[]} sourceids The selected source ids
 * @returns {Promise<void>}
 */
export const saveSelectedSourceIds = (contextid, sourceids) =>
    DataManager.saveSelectedSourceIds(Number(contextid), sourceids);

/**
 * Subscribe to changes of the selected source ids of a context.
 *
 * @param {number} contextid The context id
 * @param {Function} callback Called with the selected source ids
 * @returns {Function} Function to unsubscribe
 */
export const subscribe = (contextid, callback) => DataManager.subscribe(Number(contextid), callback);

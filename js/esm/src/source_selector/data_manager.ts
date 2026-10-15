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
 * Data manager for the source selection of contexts.
 *
 * Single source of truth for the selected sources of a context. ES modules are singletons, so React components
 * importing this module and legacy AMD modules using the shim local_ai_content/source_selector share the same state.
 *
 * @module     local_ai_content/source_selector/data_manager
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Fetch from '@moodle/lms/core/fetch';

/** A single selectable source returned by the API. */
export type SourceOption = {
    id: number;
    cmid: number;
    name: string;
    sourcetype?: string;
};

/** The available sources and the selected source ids of a context. */
export type ContextSourceSelection = {
    globalDocuments: SourceOption[];
    courseActivities: SourceOption[];
    externalSources: SourceOption[];
    selectedSourceIds: number[];
};

/** Callback being notified about changes of the selected source ids of a context. */
export type SelectionListener = (sourceIds: number[]) => void;

/** Shape of the GET /contexts/{contextId}/source-selections response. */
type ContextSourceSelectionResponse = {
    items?: Array<{
        globalDocuments?: SourceOption[];
        courseActivities?: SourceOption[];
        externalSources?: SourceOption[];
        selectedSourceIds?: string;
    }>;
};

const loadPromises = new Map<number, Promise<ContextSourceSelection>>();
const savePromises = new Map<number, Promise<void>>();
const selections = new Map<number, number[]>();
const listeners = new Map<number, Set<SelectionListener>>();

/**
 * Normalise source ids given as array or comma-separated string.
 *
 * @param {number[]|string} sourceIds The source ids.
 * @returns {number[]} Unique positive integer ids.
 */
export const parseSourceIds = (sourceIds: Array<number | string> | string): number[] => {
    const values = typeof sourceIds === 'string' ? sourceIds.split(',') : sourceIds;
    const ids = values
        .map((id) => parseInt(String(id).trim(), 10))
        .filter((id) => !isNaN(id) && id > 0);
    return [...new Set(ids)];
};

/**
 * Set the selected source ids of a context and notify all listeners.
 *
 * @param {number} contextId The context id.
 * @param {number[]|string} sourceIds The selected source ids.
 */
const setSelectedSourceIds = (contextId: number, sourceIds: Array<number | string> | string): void => {
    const ids = parseSourceIds(sourceIds);
    selections.set(contextId, ids);
    listeners.get(contextId)?.forEach((listener) => listener([...ids]));
};

/**
 * Load the available sources and the selected source ids of a context.
 *
 * The request is only sent once per context, subsequent calls return the cached promise.
 *
 * @param {number} contextId The context id.
 * @param {boolean} reload Whether to bypass the cache.
 * @returns {Promise<ContextSourceSelection>} The source selection of the context.
 */
export const loadSourceSelection = (contextId: number, reload = false): Promise<ContextSourceSelection> => {
    const cached = loadPromises.get(contextId);
    if (cached && !reload) {
        return cached;
    }

    const promise = Fetch.performGet('local_ai_content', `contexts/${contextId}/source-selections`)
        .then((response: Response) => response.json() as Promise<ContextSourceSelectionResponse>)
        .then((data: ContextSourceSelectionResponse) => {
            const item = data.items?.[0] ?? {};
            const selection: ContextSourceSelection = {
                globalDocuments: item.globalDocuments ?? [],
                courseActivities: item.courseActivities ?? [],
                externalSources: item.externalSources ?? [],
                selectedSourceIds: parseSourceIds(item.selectedSourceIds ?? ''),
            };
            setSelectedSourceIds(contextId, selection.selectedSourceIds);
            return selection;
        })
        .catch((error: unknown) => {
            // Drop the failed promise so the next call retries.
            loadPromises.delete(contextId);
            throw error;
        });
    loadPromises.set(contextId, promise);
    return promise;
};

/**
 * Get the currently selected source ids of a context, loading them first if necessary.
 *
 * @param {number} contextId The context id.
 * @returns {Promise<number[]>} The selected source ids, empty if they could not be loaded.
 */
export const getSelectedSourceIds = async(contextId: number): Promise<number[]> => {
    if (!selections.has(contextId)) {
        try {
            await loadSourceSelection(contextId);
        } catch {
            // A failing source selection must not block the consumers (e.g. the chat), they just work without sources.
            return [];
        }
    }
    return [...(selections.get(contextId) ?? [])];
};

/**
 * Persist the selected source ids of a context.
 *
 * The new selection is applied immediately. Saves of the same context are sent one after another,
 * so the last selection always wins on the server.
 *
 * @param {number} contextId The context id.
 * @param {number[]} sourceIds The selected source ids.
 * @returns {Promise<void>} Resolves when saved, rejects on failure.
 */
export const saveSelectedSourceIds = (contextId: number, sourceIds: number[]): Promise<void> => {
    const ids = parseSourceIds(sourceIds);
    setSelectedSourceIds(contextId, ids);

    const previous = savePromises.get(contextId) ?? Promise.resolve();
    const promise = previous
        // A failed previous save must not prevent this one.
        .catch(() => undefined)
        .then(() => Fetch.performPut('local_ai_content', `contexts/${contextId}/source-selections`, {
            body: {selectedSourceIds: ids.join(',')},
        }))
        .then(() => {
            // The cached source lists (e.g. external sources) depend on the selection, so reload them next time.
            loadPromises.delete(contextId);
        });
    savePromises.set(contextId, promise);
    return promise;
};

/**
 * Subscribe to changes of the selected source ids of a context.
 *
 * @param {number} contextId The context id.
 * @param {SelectionListener} listener The callback.
 * @returns {() => void} Function to unsubscribe.
 */
export const subscribe = (contextId: number, listener: SelectionListener): (() => void) => {
    const contextListeners = listeners.get(contextId) ?? new Set<SelectionListener>();
    contextListeners.add(listener);
    listeners.set(contextId, contextListeners);

    return () => {
        contextListeners.delete(listener);
        if (contextListeners.size === 0) {
            listeners.delete(contextId);
        }
    };
};

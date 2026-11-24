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

/** How a selected source is used: search the relevant passages or add the complete content. */
export type SelectionMode = 'search' | 'full';

/** A single selectable source returned by the API. */
export type SourceOption = {
    id: number;
    cmId: number | null;
    name: string;
    sourceType: string;
    /** Human-readable type of the source, for module sources the activity type. */
    typeName: string;
    /** Url of the activity icon for module sources, empty otherwise. */
    iconUrl: string;
    /** Name of the course or system the source belongs to. */
    origin: string;
    /** The modes the source can be selected with. */
    modes: SelectionMode[];
    /** Number of characters of the content, null if unknown. */
    contentLength: number | null;
    /** Id of the course section of an activity in a course format with sections, null otherwise. */
    sectionId: number | null;
    /** Whether the content changed since the source was indexed with the embedding model of the current user. */
    outdated: boolean;
};

/** A course section containing selectable activities. */
export type CourseSection = {
    id: number;
    name: string;
};

/** The available sources and the selection of a context. */
export type ContextSourceSelection = {
    globalDocuments: SourceOption[];
    courseActivities: SourceOption[];
    externalSources: SourceOption[];
    /** The sections of the course activities in course order, empty if the course format has no sections. */
    courseSections: CourseSection[];
    selectedSourceIds: number[];
    /** The selected sources whose complete content is used. */
    fullSourceIds: number[];
    /** Whether the current user may change the selection of the context. */
    canSelect: boolean;
    /** Number of characters of a complete content above which a warning is shown, 0 for no warning. */
    fullContentWarnChars: number;
    /** Number of characters of all complete contents above which a warning is shown, 0 for no warning. */
    fullContentTotalWarnChars: number;
};

/** Callback being notified about changes of the selected source ids of a context. */
export type SelectionListener = (sourceIds: number[]) => void;

/** Shape of the GET /contexts/{contextId}/source-selections response. */
type ContextSourceSelectionResponse = {
    items: Array<{
        globalDocuments: SourceOption[];
        courseActivities: SourceOption[];
        externalSources: SourceOption[];
        courseSections: CourseSection[];
        selectedSourceIds: string;
        fullSourceIds: string;
        canSelect: boolean;
        fullContentWarnChars: number;
        fullContentTotalWarnChars: number;
    }>;
};

const loadPromises = new Map<number, Promise<ContextSourceSelection>>();
const savePromises = new Map<number, Promise<void>>();
const selections = new Map<number, number[]>();
const fullSelections = new Map<number, number[]>();
const listeners = new Map<number, Set<SelectionListener>>();

/**
 * Normalise source ids given as array or comma-separated string.
 *
 * @param sourceIds Ids as array or comma-separated string.
 * @returns Unique positive integer ids.
 */
export const parseSourceIds = (sourceIds: Array<number | string> | string): number[] => {
    const values = typeof sourceIds === 'string' ? sourceIds.split(',') : sourceIds;
    const ids = values
        .map(id => Number(String(id).trim()))
        .filter(id => Number.isSafeInteger(id) && id > 0);
    return [...new Set(ids)];
};

/**
 * Set the selected source ids of a context and notify all listeners.
 *
 * @param contextId Id of the context the selection belongs to.
 * @param sourceIds Ids of the selected sources, as array or comma-separated string.
 * @param fullSourceIds Ids of the selected sources whose complete content is used.
 */
const setSelectedSourceIds = (
    contextId: number,
    sourceIds: Array<number | string> | string,
    fullSourceIds: number[],
): void => {
    const ids = parseSourceIds(sourceIds);
    selections.set(contextId, ids);
    fullSelections.set(contextId, fullSourceIds.filter(id => ids.includes(id)));
    for (const listener of listeners.get(contextId) ?? []) {
        listener([...ids]);
    }
};

/**
 * Load the available sources and the selected source ids of a context.
 *
 * The request is only sent once per context, subsequent calls return the cached promise.
 *
 * @param contextId Id of the context to load the selection for.
 * @param reload Whether to bypass the cache.
 * @returns The source selection of the context.
 */
export const loadSourceSelection = async (contextId: number, reload = false): Promise<ContextSourceSelection> => {
    const cached = loadPromises.get(contextId);
    if (cached && !reload) {
        return cached;
    }

    const promise = Fetch.performGet('local_ai_content', `contexts/${contextId}/source-selections`)
        .then(async (response: Response) => response.json() as Promise<ContextSourceSelectionResponse>)
        .then((data: ContextSourceSelectionResponse) => {
            const item = data.items[0];
            const selection: ContextSourceSelection = {
                globalDocuments: item.globalDocuments,
                courseActivities: item.courseActivities,
                externalSources: item.externalSources,
                courseSections: item.courseSections,
                selectedSourceIds: parseSourceIds(item.selectedSourceIds),
                fullSourceIds: parseSourceIds(item.fullSourceIds),
                canSelect: item.canSelect,
                fullContentWarnChars: item.fullContentWarnChars,
                fullContentTotalWarnChars: item.fullContentTotalWarnChars,
            };
            setSelectedSourceIds(contextId, selection.selectedSourceIds, selection.fullSourceIds);
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
 * @param contextId Id of the context to get the selection for.
 * @returns The selected source ids, empty if they could not be loaded.
 */
export const getSelectedSourceIds = async (contextId: number): Promise<number[]> => {
    if (!selections.has(contextId)) {
        await loadSourceSelection(contextId);
    }

    return [...selections.get(contextId)!];
};

/**
 * Persist the selection of a context.
 *
 * The new selection is applied immediately. Saves of the same context are sent one after another,
 * so the last selection always wins on the server.
 *
 * @param contextId Id of the context to store the selection for.
 * @param sourceIds Ids of the sources to select.
 * @param fullSourceIds Ids of the selected sources whose complete content is used, the other ones are searched.
 * Without them the modes of the sources staying selected are kept.
 * @returns Resolves when saved, rejects on failure.
 */
export const saveSelectedSourceIds = async (
    contextId: number,
    sourceIds: number[],
    fullSourceIds?: number[],
): Promise<void> => {
    const ids = parseSourceIds(sourceIds);
    const fullIds = parseSourceIds(fullSourceIds ?? fullSelections.get(contextId) ?? []).filter(id => ids.includes(id));
    setSelectedSourceIds(contextId, ids, fullIds);

    const previous = savePromises.get(contextId) ?? Promise.resolve();
    const promise = previous
        // A failed previous save must not prevent this one.
        .catch(() => undefined)
        .then(async () => Fetch.performPut('local_ai_content', `contexts/${contextId}/source-selections`, {
            body: {selectedSourceIds: ids.join(','), fullSourceIds: fullIds.join(',')},
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
 * @param contextId Id of the context to watch.
 * @param listener Called with the selected source ids on every change.
 * @returns Function to unsubscribe.
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

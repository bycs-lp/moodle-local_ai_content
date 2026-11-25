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
 * REST calls and data types of the source management.
 *
 * @module     local_ai_content/source_manager/repository
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Fetch from '@moodle/lms/core/fetch';

/** The indexing state of one source for one embedding model. */
export type ModelIndexState = {
    model: string;
    status: 'queued' | 'running' | 'indexed' | 'failed' | 'outdated';
    statusLabel: string;
    lastIndexedAt: string | null;
};

/** The complete indexing state of one source. */
export type IndexState = {
    sourceId: number;
    status: 'idle' | 'queued' | 'running' | 'indexed' | 'failed' | 'outdated';
    statusLabel: string;
    hasIndex: boolean;
    percent: number;
    message: string;
    debugInfo: string;
    lastIndexedAt: string | null;
    models: ModelIndexState[];
    currentModel: string | null;
    canIndexCurrentModel: boolean;
};

/** An activity of the course with its source, if it has one. */
export type ModuleSource = {
    cmId: number;
    modName: string;
    modDisplayName: string;
    iconUrl: string;
    name: string;
    /** The url of the view page of the activity, null if it has none. */
    url: string | null;
    /** The course section of the activity in course formats with sections, null otherwise. */
    sectionId: number | null;
    /** The id of the source, 0 if the activity has never been shared. */
    sourceId: number;
    enabled: boolean;
    indexState: IndexState;
};

/** A document source. */
export type DocumentSource = {
    id: number;
    name: string;
    description: string;
    content: string;
    enabled: boolean;
    canEdit: boolean;
    indexState: IndexState;
};

/** A course section containing activities. */
export type CourseSection = {
    id: number;
    name: string;
};

/** The sources managed on the management page of a course. */
export type SourceOverview = {
    courseContextId: number;
    canManageGlobalSources: boolean;
    indexingAvailable: boolean;
    /** Why sources cannot be indexed, null if they can. */
    indexingUnavailableReason: 'novecstore' | 'noembedding' | null;
    /** The course sections containing activities in course page order, empty in course formats without sections. */
    courseSections: CourseSection[];
    items: {
        modules: ModuleSource[];
        globalDocuments: DocumentSource[];
        courseDocuments: DocumentSource[];
    };
};

/** The editable fields of a document source. */
export type DocumentFields = {
    name: string;
    description: string;
    content: string;
};

/** One page of the chunks of a source as they are stored in the vector store. */
export type IndexedChunks = {
    /** The chunks in content order; their contents joined result in the searchable text. */
    items: Array<{chunk: number; content: string}>;
    pagination: {page: number; pageSize: number; totalItems: number};
};

const COMPONENT = 'local_ai_content';

/**
 * Send a request to the REST API of the plugin and return the decoded response.
 *
 * @param method The HTTP method.
 * @param path The path below the API base of the plugin.
 * @param body The data sent as JSON.
 * @returns The decoded response.
 */
const request = async <T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> => {
    const response = await Fetch.request(COMPONENT, path, {method, body});
    return response.json() as Promise<T>;
};

/**
 * Load the sources managed in a course.
 *
 * @param contextId The context of the course.
 * @returns The activities, documents and indexing availability of the course.
 */
export const getSources = async (contextId: number): Promise<SourceOverview> =>
    request('GET', `contexts/${contextId}/sources`);

/**
 * Share activities and documents with AI or stop sharing them; either all or none of them are changed.
 *
 * @param contextId The context of the course.
 * @param cmIds The ids of the course modules.
 * @param documentIds The ids of the document sources.
 * @param enabled Whether the sources are shared.
 * @returns The sources after the change.
 */
export const setSharing = async (
    contextId: number,
    cmIds: number[],
    documentIds: number[],
    enabled: boolean,
): Promise<SourceOverview> => request('PATCH', `contexts/${contextId}/sources`, {cmIds, documentIds, enabled});

/**
 * Index sources with the embedding model of the current user; either all or none of them are queued.
 *
 * @param sourceIds The sources to index.
 * @returns The new index states of the sources.
 */
export const indexSources = async (sourceIds: number[]): Promise<IndexState[]> => {
    const response = await request<{items: IndexState[]}>('POST', 'source-indexes', {sourceIds});
    return response.items;
};

/**
 * Load the index states of the sources managed in a course.
 *
 * @param contextId The context of the course.
 * @returns The index states and the poll interval suggested by the server.
 */
export const getIndexStates = async (contextId: number): Promise<{items: IndexState[]; pollIntervalSeconds: number}> =>
    request('GET', `contexts/${contextId}/index-states`);

/**
 * Load one page of the chunks of a source as they are stored in the vector store.
 *
 * @param contextId The context of the course.
 * @param sourceId The id of the module or document source.
 * @param page The page, starting at 1.
 * @returns The chunks of the page and the pagination of all chunks.
 */
export const getIndexedChunks = async (contextId: number, sourceId: number, page: number): Promise<IndexedChunks> =>
    request('GET', `contexts/${contextId}/sources/${sourceId}/indexed-chunks?page=${page}`);

/**
 * Create a document source.
 *
 * @param contextId The context of the course.
 * @param scope Whether the document belongs to the course or is global.
 * @param fields The name, description and content of the document.
 */
export const createDocument = async (contextId: number, scope: 'course' | 'global', fields: DocumentFields): Promise<void> => {
    await request('POST', `contexts/${contextId}/document-sources`, {scope, ...fields});
};

/**
 * Update a document source.
 *
 * @param contextId The context of the course.
 * @param sourceId The document source to update.
 * @param fields The new name, description and content of the document.
 * @returns The sources after the change.
 */
export const updateDocument = async (contextId: number, sourceId: number, fields: DocumentFields): Promise<SourceOverview> =>
    request('PATCH', `contexts/${contextId}/document-sources/${sourceId}`, fields);

/**
 * Delete a document source.
 *
 * @param contextId The context of the course.
 * @param sourceId The document source to delete.
 * @returns The sources after the change.
 */
export const deleteDocument = async (contextId: number, sourceId: number): Promise<SourceOverview> =>
    request('DELETE', `contexts/${contextId}/document-sources/${sourceId}`);


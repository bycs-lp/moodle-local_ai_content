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
 * React source management UI for course-level source configuration.
 *
 * @module     local_ai_content/source_manager
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {Button, ProgressBar} from '@moodlehq/design-system';
import Fetch from '@moodle/lms/core/fetch';
import Log from '@moodle/lms/core/log';
import MoodleString from '@moodle/lms/core/String';

/** The indexing state of one source for one embedding model. */
type ModelIndexState = {
    model: string;
    status: 'queued' | 'running' | 'indexed' | 'failed' | 'outdated';
    statusLabel: string;
    lastIndexedAt: string | null;
};

/** The complete indexing state of one source as delivered by the backend. */
type IndexState = {
    sourceId: number;
    status: 'idle' | 'queued' | 'running' | 'indexed' | 'failed' | 'outdated';
    statusLabel: string;
    allowIndex: boolean;
    percent: number;
    message: string;
    debugInfo: string;
    lastIndexedAt: string | null;
    models: ModelIndexState[];
    currentModel: string | null;
    canIndexCurrentModel: boolean;
};

type ModuleSource = {
    cmId: number;
    modName: string;
    modDisplayName: string;
    name: string;
    sourceId: number;
    enabled: boolean;
    indexState: IndexState;
};

type DocumentSource = {
    id: number;
    name: string;
    description: string;
    content: string;
    enabled: boolean;
    canEdit: boolean;
    indexState: IndexState;
};

type SourceManagementResponse = {
    courseContextId: number;
    canManageGlobalSources: boolean;
    items: {
        modules: ModuleSource[];
        globalDocuments: DocumentSource[];
        courseDocuments: DocumentSource[];
    };
};

type IndexStatesResponse = {
    items: IndexState[];
    pollIntervalSeconds: number;
};

type DocumentTableRow = DocumentSource & {
    scope: 'global' | 'course';
};

type EditableDocument = {
    id: number;
    name: string;
    description: string;
    content: string;
};

type Props = {
    contextid: number;
};

/**
 * Perform one REST request against the plugin API and return the decoded JSON response.
 */
async function apiRequest<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    const response = await Fetch.request('local_ai_content', path, {method, body});
    return response.json() as Promise<T>;
}

/**
 * Get the message of a failed request: core/fetch rejects with the HTTP status text, other failures with an Error.
 */
function getErrorMessage(caught: unknown): string {
    return caught instanceof Error ? caught.message : String(caught);
}

function isActive(state: IndexState): boolean {
    return state.status === 'queued' || state.status === 'running';
}

function formatTimestamp(timestamp: string | null): string {
    if (timestamp === null) {
        return '-';
    }

    return new Date(timestamp).toLocaleString();
}

/**
 * Renders the summarized status badge, the progress bar and the error message of one source, the states of the single
 * embedding models and the action to index the source with the embedding model of the current user.
 */
function IndexStatusCell({state, disabled, onIndexCurrentModel}: {
    state: IndexState;
    disabled: boolean;
    onIndexCurrentModel: () => void;
}) {
    const active = isActive(state);
    const failed = state.status === 'failed';
    const badgeclass = failed ? 'badge-danger' : (state.status === 'outdated' ? 'bg-warning text-dark' : 'badge-light');

    return (
        <>
            <span className={`badge ${badgeclass}`}>{state.statusLabel}</span>
            {active && (
                <div className='mt-1'>
                    <ProgressBar
                        value={Math.max(2, state.percent)}
                        min={0}
                        max={100}
                        status='loading'
                        labelVariant='none'
                        title={state.message === '' ? state.statusLabel : state.message}
                        count={`${Math.round(state.percent)}%`}
                        animated
                    />
                </div>
            )}
            {failed && state.message !== '' && (
                <div className='small text-danger mt-1'>{state.message}</div>
            )}
            {state.models.length > 0 && (
                <ul className='list-unstyled small text-muted mt-1 mb-0'>
                    {state.models.map(modelstate => (
                        <li key={modelstate.model}>{modelstate.model}: {modelstate.statusLabel}</li>
                    ))}
                </ul>
            )}
            {state.canIndexCurrentModel && state.currentModel !== null && (
                <button
                    type='button'
                    className='btn btn-link btn-sm p-0 mt-1'
                    disabled={disabled || active}
                    onClick={onIndexCurrentModel}
                >
                    <MoodleString identifier='indexwithmymodel' component='local_ai_content' params={state.currentModel}/>
                </button>
            )}
        </>
    );
}

export default function SourceManager({contextid}: Props) {
    const [payload, setPayload] = useState<SourceManagementResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [pollIntervalMs, setPollIntervalMs] = useState<number>(5000);

    const [editingDocument, setEditingDocument] = useState<EditableDocument | null>(null);
    const [documentToDelete, setDocumentToDelete] = useState<DocumentTableRow | null>(null);
    const [newDocumentScope, setNewDocumentScope] = useState<'global' | 'course' | null>(null);
    const [newDocument, setNewDocument] = useState<EditableDocument>({
        id: 0, name: '', description: '', content: '',
    });

    const plusIcon = <i className='icon fa fa-plus' aria-hidden='true'/>;
    const loggedDebugInfoReference = useRef<Record<number, string>>({});

    const documentRows = useMemo<DocumentTableRow[]>(() => {
        if (!payload) {
            return [];
        }

        return [
            ...payload.items.globalDocuments.map(row => ({...row, scope: 'global' as const})),
            ...payload.items.courseDocuments.map(row => ({...row, scope: 'course' as const})),
        ].sort((a, b) => a.name.localeCompare(b.name));
    }, [payload]);

    const hasActiveTasks = useMemo(() => {
        if (!payload) {
            return false;
        }

        return [
            ...payload.items.modules,
            ...payload.items.globalDocuments,
            ...payload.items.courseDocuments,
        ].some(row => isActive(row.indexState));
    }, [payload]);

    /**
     * Send the technical failure details of the given states to the browser console.
     *
     * The backend only fills them while developer debugging is enabled.
     */
    const logDebugInfo = (states: IndexState[]) => {
        for (const state of states) {
            if (state.debugInfo === '' || loggedDebugInfoReference.current[state.sourceId] === state.debugInfo) {
                continue;
            }

            loggedDebugInfoReference.current[state.sourceId] = state.debugInfo;
            Log.debug(`Indexing failed for source ${state.sourceId}:\n${state.debugInfo}`, 'local_ai_content');
        }
    };

    /** Replace the whole source list. */
    const applyPayload = (data: SourceManagementResponse) => {
        logDebugInfo([
            ...data.items.modules,
            ...data.items.globalDocuments,
            ...data.items.courseDocuments,
        ].map(row => row.indexState));
        setPayload(data);
    };

    /**
     * The single place translating incoming index states into the rendered UI state.
     */
    const applyIndexStates = (states: IndexState[]) => {
        logDebugInfo(states);

        const byid = new Map(states.map(state => [state.sourceId, state]));
        setPayload(current => {
            if (!current) {
                return current;
            }

            const merge = <T extends {indexState: IndexState}>(row: T, sourceId: number): T => {
                const state = byid.get(sourceId);
                return state ? {...row, indexState: state} : row;
            };

            return {
                ...current,
                items: {
                    modules: current.items.modules.map(row => merge(row, row.sourceId)),
                    globalDocuments: current.items.globalDocuments.map(row => merge(row, row.id)),
                    courseDocuments: current.items.courseDocuments.map(row => merge(row, row.id)),
                },
            };
        });
    };

    const loadPayload = async () => {
        setLoading(true);
        setError(null);
        try {
            applyPayload(await apiRequest<SourceManagementResponse>('GET', `contexts/${contextid}/sources`));
        } catch (error_) {
            setError(`Die Quellen konnten nicht geladen werden: ${getErrorMessage(error_)}`);
        } finally {
            setLoading(false);
        }
    };

    /** Perform a write request and reload the full source list afterwards. */
    const performWrite = async (method: string, path: string, body?: Record<string, unknown>): Promise<boolean> => {
        setSaving(true);
        setError(null);
        try {
            await apiRequest(method, path, body);
            applyPayload(await apiRequest<SourceManagementResponse>('GET', `contexts/${contextid}/sources`));
            return true;
        } catch (error_) {
            setError(`Die Aktion konnte nicht ausgeführt werden: ${getErrorMessage(error_)}`);
            return false;
        } finally {
            setSaving(false);
        }
    };

    /** Start or stop indexing; the response is the new index state of that source. */
    const handleAllowIndexToggle = async (sourceId: number, allowIndex: boolean) => {
        setSaving(true);
        setError(null);
        try {
            applyIndexStates([await apiRequest<IndexState>('PUT', `sources/${sourceId}/index-state`, {allowIndex})]);
        } catch (error_) {
            setError(`Der Indizierungsstatus konnte nicht geändert werden: ${getErrorMessage(error_)}`);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        void loadPayload();
    }, [contextid]);

    useEffect(() => {
        if (!hasActiveTasks) {
            return undefined;
        }

        const timer = setInterval(() => {
            void apiRequest<IndexStatesResponse>('GET', `contexts/${contextid}/index-states`).then(data => {
                setPollIntervalMs(data.pollIntervalSeconds * 1000);
                applyIndexStates(data.items);
            });
        }, pollIntervalMs);

        return () => {
            clearInterval(timer);
        };
    }, [hasActiveTasks, contextid, pollIntervalMs]);

    if (loading) {
        return <div className='local-ai-content-source-manager local-ai-content-source-manager--loading'>Lade Quellen...</div>;
    }

    if (!payload) {
        return <div className='text-danger small mt-2'>{error}</div>;
    }

    const openCreateModal = () => {
        setError(null);
        setNewDocumentScope('course');
        setNewDocument({
            id: 0, name: '', description: '', content: '',
        });
    };

    const closeCreateModal = () => {
        setNewDocumentScope(null);
    };

    const closeEditModal = () => {
        setEditingDocument(null);
    };

    const closeDeleteModal = () => {
        setDocumentToDelete(null);
    };

    const handleCreateDocument = async () => {
        if (newDocumentScope === null) {
            return;
        }

        if (newDocument.name.trim() === '') {
            setError('Bitte einen Namen für das Dokument angeben.');
            return;
        }

        const saved = await performWrite('POST', `contexts/${contextid}/document-sources`, {
            scope: newDocumentScope,
            name: newDocument.name,
            description: newDocument.description,
            content: newDocument.content,
        });
        if (saved) {
            setNewDocumentScope(null);
        }
    };

    const handleUpdateDocument = async () => {
        if (!editingDocument) {
            return;
        }

        const saved = await performWrite('PATCH', `contexts/${contextid}/document-sources/${editingDocument.id}`, {
            name: editingDocument.name,
            description: editingDocument.description,
            content: editingDocument.content,
        });
        if (saved) {
            setEditingDocument(null);
        }
    };

    const handleDeleteDocument = async () => {
        if (documentToDelete === null) {
            return;
        }

        const deleted = await performWrite('DELETE', `contexts/${contextid}/document-sources/${documentToDelete.id}`);
        if (deleted) {
            setDocumentToDelete(null);
        }
    };

    return (
        <div className='local-ai-content-source-manager'>
            <section className='mb-4'>
                <div className='d-flex justify-content-between align-items-center mb-2'>
                    <h5 className='mb-0'>Dokumente</h5>
                    <Button
                        type='button'
                        variant='primary'
                        disabled={saving}
                        onClick={openCreateModal}
                        startIcon={plusIcon}
                        label='Dokument anlegen'
                    />
                </div>
                <table className='table table-sm table-striped'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Beschreibung</th>
                            <th>Geltungsbereich</th>
                            <th>Für KI-Zugriff aktiv</th>
                            <th>In Vektorstore indizieren</th>
                            <th>Status</th>
                            <th>Last indexed</th>
                            <th>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documentRows.map(row => (
                            <tr key={row.id}>
                                <td>{row.name}</td>
                                <td>{row.description === '' ? '-' : row.description}</td>
                                <td>
                                    {row.scope === 'global'
                                        ? (
                                            <i className='icon fa fa-globe' aria-label='Globale Quelle' title='Globale Quelle'/>
                                        )
                                        : (
                                            <i className='icon fa fa-graduation-cap' aria-label='Kursquelle' title='Kursquelle'/>
                                        )}
                                </td>
                                <td>
                                    <div className='form-check form-switch m-0'>
                                        <input
                                            id={`document-enabled-${row.id}`}
                                            className='form-check-input'
                                            type='checkbox'
                                            role='switch'
                                            checked={row.enabled}
                                            disabled={saving || !row.canEdit}
                                            onChange={() => {
                                                void performWrite(
                                                    'PATCH',
                                                    `contexts/${contextid}/document-sources/${row.id}`,
                                                    {enabled: !row.enabled},
                                                );
                                            }}
                                            aria-label={`Dokument ${row.name} für KI-Zugriff aktivieren`}
                                        />
                                    </div>
                                </td>
                                <td>
                                    {row.enabled && (
                                        <div className='form-check form-switch m-0'>
                                            <input
                                                id={`document-index-${row.id}`}
                                                className='form-check-input'
                                                type='checkbox'
                                                role='switch'
                                                checked={row.indexState.allowIndex}
                                                disabled={saving || !row.canEdit || isActive(row.indexState)}
                                                onChange={() => {
                                                    void handleAllowIndexToggle(row.id, !row.indexState.allowIndex);
                                                }}
                                                aria-label={`Dokument ${row.name} in Vektorstore indizieren`}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td>{row.enabled && (
                                    <IndexStatusCell
                                        state={row.indexState}
                                        disabled={saving || !row.canEdit}
                                        onIndexCurrentModel={() => {
                                            void handleAllowIndexToggle(row.id, true);
                                        }}
                                    />
                                )}</td>
                                <td>{row.enabled && formatTimestamp(row.indexState.lastIndexedAt)}</td>
                                <td>
                                    {row.canEdit && (
                                        <div className='d-flex gap-1'>
                                            <button
                                                type='button'
                                                className='btn btn-link p-0'
                                                disabled={saving}
                                                onClick={() => {
                                                    setEditingDocument({
                                                        id: row.id,
                                                        name: row.name,
                                                        description: row.description,
                                                        content: row.content,
                                                    });
                                                }}
                                                aria-label={`Dokument ${row.name} bearbeiten`}
                                                title='Bearbeiten'
                                            >
                                                <i className='icon fa fa-pencil' aria-hidden='true'/>
                                            </button>
                                            <button
                                                type='button'
                                                className='btn btn-link text-danger p-0'
                                                disabled={saving}
                                                onClick={() => {
                                                    setDocumentToDelete(row);
                                                }}
                                                aria-label={`Dokument ${row.name} löschen`}
                                                title='Löschen'
                                            >
                                                <i className='icon fa fa-trash' aria-hidden='true'/>
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {documentRows.length === 0 && (
                            <tr>
                                <td colSpan={8} className='text-muted'>Keine Dokumente vorhanden.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <section className='mb-4'>
                <h5>Aktivitäten dieses Kurses</h5>
                <table className='table table-sm table-hover'>
                    <thead>
                        <tr>
                            <th>Aktivität</th>
                            <th>Typ</th>
                            <th>Für KI-Zugriff aktiv</th>
                            <th>In Vektorstore indizieren</th>
                            <th>Status</th>
                            <th>Last indexed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payload.items.modules.map(row => (
                            <tr key={row.cmId}>
                                <td>{row.name}</td>
                                <td>{row.modDisplayName === '' ? row.modName : row.modDisplayName}</td>
                                <td>
                                    <div className='form-check form-switch m-0'>
                                        <input
                                            id={`module-enabled-${row.cmId}`}
                                            className='form-check-input'
                                            type='checkbox'
                                            role='switch'
                                            checked={row.enabled}
                                            disabled={saving}
                                            onChange={() => {
                                                void performWrite(
                                                    'PATCH',
                                                    `contexts/${contextid}/module-sources/${row.cmId}`,
                                                    {enabled: !row.enabled},
                                                );
                                            }}
                                            aria-label={`Aktivität ${row.name} für KI-Zugriff aktivieren`}
                                        />
                                    </div>
                                </td>
                                <td>
                                    {row.enabled && (
                                        <div className='form-check form-switch m-0'>
                                            <input
                                                id={`module-index-${row.cmId}`}
                                                className='form-check-input'
                                                type='checkbox'
                                                role='switch'
                                                checked={row.indexState.allowIndex}
                                                disabled={saving || isActive(row.indexState)}
                                                onChange={() => {
                                                    void handleAllowIndexToggle(row.sourceId, !row.indexState.allowIndex);
                                                }}
                                                aria-label={`Aktivität ${row.name} in Vektorstore indizieren`}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td>{row.enabled && (
                                    <IndexStatusCell
                                        state={row.indexState}
                                        disabled={saving}
                                        onIndexCurrentModel={() => {
                                            void handleAllowIndexToggle(row.sourceId, true);
                                        }}
                                    />
                                )}</td>
                                <td>{row.enabled && formatTimestamp(row.indexState.lastIndexedAt)}</td>
                            </tr>
                        ))}
                        {payload.items.modules.length === 0 && (
                            <tr>
                                <td colSpan={6} className='text-muted'>Keine unterstützten Aktivitäten gefunden.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className='small text-muted'>
                    Hier werden nur Aktivitäten angezeigt, deren Typ aktuell vom Plugin unterstützt wird.
                </div>
            </section>

            {newDocumentScope !== null && (
                <>
                    <div
                        className='modal fade show d-block'
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='source-create-modal-title'
                    >
                        <div className='modal-dialog modal-lg modal-dialog-scrollable' role='document'>
                            <div className='modal-content'>
                                <div className='modal-header'>
                                    <h5 id='source-create-modal-title' className='modal-title'>Neues Dokument anlegen</h5>
                                    <button
                                        type='button'
                                        className='close'
                                        aria-label='Close'
                                        onClick={closeCreateModal}
                                        disabled={saving}
                                    >
                                        <span aria-hidden='true'>&times;</span>
                                    </button>
                                </div>
                                <div className='modal-body'>
                                    {payload.canManageGlobalSources && (
                                        <div className='form-group'>
                                            <label htmlFor='source-create-scope'>Quelle anlegen in</label>
                                            <select
                                                id='source-create-scope'
                                                className='custom-select'
                                                value={newDocumentScope}
                                                onChange={event => {
                                                    setNewDocumentScope(event.target.value === 'global' ? 'global' : 'course');
                                                }}
                                            >
                                                <option value='course'>Diesem Kurs</option>
                                                <option value='global'>Systemkontext (global)</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className='form-group'>
                                        <label>Name</label>
                                        <input
                                            className='form-control form-control-sm'
                                            value={newDocument.name}
                                            onChange={event => {
                                                setNewDocument({...newDocument, name: event.target.value});
                                            }}
                                        />
                                    </div>
                                    <div className='form-group'>
                                        <label>Beschreibung</label>
                                        <input
                                            className='form-control form-control-sm'
                                            value={newDocument.description}
                                            onChange={event => {
                                                setNewDocument({...newDocument, description: event.target.value});
                                            }}
                                        />
                                    </div>
                                    <div className='form-group mb-0'>
                                        <label>Inhalt</label>
                                        <textarea
                                            className='form-control form-control-sm'
                                            rows={8}
                                            value={newDocument.content}
                                            onChange={event => {
                                                setNewDocument({...newDocument, content: event.target.value});
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className='modal-footer'>
                                    <Button
                                        type='button'
                                        variant='secondary'
                                        disabled={saving}
                                        onClick={closeCreateModal}
                                        label='Abbrechen'
                                    />
                                    <Button
                                        type='button'
                                        variant='primary'
                                        disabled={saving}
                                        onClick={handleCreateDocument}
                                        label='Dokument anlegen'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='modal-backdrop fade show' onClick={closeCreateModal}/>
                </>
            )}

            {editingDocument && (
                <>
                    <div
                        className='modal fade show d-block'
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='source-edit-modal-title'
                    >
                        <div className='modal-dialog modal-lg modal-dialog-scrollable' role='document'>
                            <div className='modal-content'>
                                <div className='modal-header'>
                                    <h5 id='source-edit-modal-title' className='modal-title'>Dokument bearbeiten</h5>
                                    <button
                                        type='button'
                                        className='close'
                                        aria-label='Close'
                                        onClick={closeEditModal}
                                        disabled={saving}
                                    >
                                        <span aria-hidden='true'>&times;</span>
                                    </button>
                                </div>
                                <div className='modal-body'>
                                    <div className='form-group'>
                                        <label>Name</label>
                                        <input
                                            className='form-control form-control-sm'
                                            value={editingDocument.name}
                                            onChange={event => {
                                                setEditingDocument({...editingDocument, name: event.target.value});
                                            }}
                                        />
                                    </div>
                                    <div className='form-group'>
                                        <label>Beschreibung</label>
                                        <input
                                            className='form-control form-control-sm'
                                            value={editingDocument.description}
                                            onChange={event => {
                                                setEditingDocument({...editingDocument, description: event.target.value});
                                            }}
                                        />
                                    </div>
                                    <div className='form-group mb-0'>
                                        <label>Inhalt</label>
                                        <textarea
                                            className='form-control form-control-sm'
                                            rows={8}
                                            value={editingDocument.content}
                                            onChange={event => {
                                                setEditingDocument({...editingDocument, content: event.target.value});
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className='modal-footer'>
                                    <Button
                                        type='button'
                                        variant='secondary'
                                        disabled={saving}
                                        onClick={closeEditModal}
                                        label='Abbrechen'
                                    />
                                    <Button
                                        type='button'
                                        variant='primary'
                                        disabled={saving}
                                        onClick={handleUpdateDocument}
                                        label='Speichern'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='modal-backdrop fade show' onClick={closeEditModal}/>
                </>
            )}

            {documentToDelete !== null && (
                <>
                    <div
                        className='modal fade show d-block'
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='source-delete-modal-title'
                    >
                        <div className='modal-dialog' role='document'>
                            <div className='modal-content'>
                                <div className='modal-header'>
                                    <h5 id='source-delete-modal-title' className='modal-title'>Quelle löschen</h5>
                                    <button
                                        type='button'
                                        className='close'
                                        aria-label='Close'
                                        onClick={closeDeleteModal}
                                        disabled={saving}
                                    >
                                        <span aria-hidden='true'>&times;</span>
                                    </button>
                                </div>
                                <div className='modal-body'>
                                    Möchtest du die Quelle „{documentToDelete.name}“ wirklich löschen?
                                </div>
                                <div className='modal-footer'>
                                    <Button
                                        type='button'
                                        variant='secondary'
                                        disabled={saving}
                                        onClick={closeDeleteModal}
                                        label='Abbrechen'
                                    />
                                    <Button
                                        type='button'
                                        variant='danger'
                                        disabled={saving}
                                        onClick={handleDeleteDocument}
                                        label='Löschen'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='modal-backdrop fade show' onClick={closeDeleteModal}/>
                </>
            )}

            {error !== null && <div className='text-danger small mt-2'>{error}</div>}
        </div>
    );
}

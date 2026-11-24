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
    use,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Badge,
    Button,
    CloseButton,
    ProgressBar,
    Switch,
} from '@moodlehq/design-system';
import {pluginString, StringsProvider} from './strings';
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
    hasIndex: boolean;
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
    indexingAvailable: boolean;
    /** Why sources cannot be indexed, null if they can. */
    indexingUnavailableReason: 'novecstore' | 'noembedding' | null;
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
function IndexStatusCell({state, indexingAvailable, disabled, onIndexCurrentModel}: {
    state: IndexState;
    indexingAvailable: boolean;
    disabled: boolean;
    onIndexCurrentModel: () => void;
}) {
    const active = isActive(state);
    const failed = state.status === 'failed';
    const badgevariant = failed ? 'danger' : (state.status === 'outdated' ? 'warning' : 'secondary');

    return (
        <>
            <Badge variant={badgevariant} subtle={badgevariant === 'secondary'} label={state.statusLabel}/>
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
            {indexingAvailable && state.canIndexCurrentModel && state.currentModel !== null && (
                <Button
                    variant='ghost'
                    size='sm'
                    className='mt-1'
                    label={use(pluginString('indexwithmymodel', state.currentModel))}
                    disabled={disabled || active}
                    onClick={onIndexCurrentModel}
                />
            )}
        </>
    );
}

/**
 * Renders the status of a source shared with AI: the indexing state if the source is indexed, otherwise a hint that the
 * source is only shared but cannot be searched, with the action to index it if indexing is available.
 */
function SharingStatusCell({state, indexingAvailable, disabled, onIndex}: {
    state: IndexState;
    indexingAvailable: boolean;
    disabled: boolean;
    onIndex: () => void;
}) {
    if (state.hasIndex) {
        return <IndexStatusCell state={state} indexingAvailable={indexingAvailable} disabled={disabled}
            onIndexCurrentModel={onIndex}/>;
    }

    return (
        <>
            <Badge variant='secondary' subtle label={use(pluginString('sharednotsearchable'))}/>
            <div className='small text-muted mt-1'>
                <MoodleString identifier='sharednotsearchable_desc' component='local_ai_content'/>
            </div>
            {indexingAvailable && (
                <Button
                    variant='ghost'
                    size='sm'
                    className='mt-1'
                    label={use(pluginString('makesearchable'))}
                    disabled={disabled}
                    onClick={onIndex}
                />
            )}
        </>
    );
}

export default function SourceManager(props: Props) {
    return (
        <StringsProvider>
            <SourceManagerContent {...props}/>
        </StringsProvider>
    );
}

function SourceManagerContent({contextid}: Props) {
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

    /** Index a source with the embedding model of the current user; the response is the new index state of that source. */
    const handleIndex = async (sourceId: number) => {
        setSaving(true);
        setError(null);
        try {
            applyIndexStates([await apiRequest<IndexState>('POST', `sources/${sourceId}/index`)]);
        } catch (error_) {
            setError(`Die Indizierung konnte nicht gestartet werden: ${getErrorMessage(error_)}`);
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
            {payload.indexingUnavailableReason === 'novecstore' && (
                <div className='alert alert-info' role='status'>
                    <MoodleString identifier='indexingnotavailable_novecstore' component='local_ai_content'/>
                </div>
            )}
            {payload.indexingUnavailableReason === 'noembedding' && (
                <div className='alert alert-info' role='status'>
                    <MoodleString identifier='searchnotavailable' component='local_ai_content'/>
                </div>
            )}
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
                            <th>Für KI freigegeben</th>
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
                                    <Switch
                                        id={`document-enabled-${row.id}`}
                                        checked={row.enabled}
                                        disabled={saving || !row.canEdit}
                                        onChange={() => {
                                            void performWrite(
                                                'PATCH',
                                                `contexts/${contextid}/document-sources/${row.id}`,
                                                {enabled: !row.enabled},
                                            );
                                        }}
                                        hideLabel
                                        label={`Dokument ${row.name} für KI freigeben`}
                                    />
                                </td>
                                <td>{row.enabled && (
                                    <SharingStatusCell
                                        state={row.indexState}
                                        indexingAvailable={payload.indexingAvailable}
                                        disabled={saving || !row.canEdit}
                                        onIndex={() => {
                                            void handleIndex(row.id);
                                        }}
                                    />
                                )}</td>
                                <td>{row.enabled && row.indexState.hasIndex && formatTimestamp(row.indexState.lastIndexedAt)}</td>
                                <td>
                                    {row.canEdit && (
                                        <div className='d-flex gap-1'>
                                            <Button
                                                variant='ghost'
                                                size='sm'
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
                                                startIcon={<i className='icon fa fa-pencil m-0' aria-hidden='true'/>}
                                            />
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                className='text-danger'
                                                disabled={saving}
                                                onClick={() => {
                                                    setDocumentToDelete(row);
                                                }}
                                                aria-label={`Dokument ${row.name} löschen`}
                                                title='Löschen'
                                                startIcon={<i className='icon fa fa-trash m-0' aria-hidden='true'/>}
                                            />
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {documentRows.length === 0 && (
                            <tr>
                                <td colSpan={7} className='text-muted'>Keine Dokumente vorhanden.</td>
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
                            <th>Für KI freigegeben</th>
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
                                    <Switch
                                        id={`module-enabled-${row.cmId}`}
                                        checked={row.enabled}
                                        disabled={saving}
                                        onChange={() => {
                                            void performWrite(
                                                'PATCH',
                                                `contexts/${contextid}/module-sources/${row.cmId}`,
                                                {enabled: !row.enabled},
                                            );
                                        }}
                                        hideLabel
                                        label={`Aktivität ${row.name} für KI freigeben`}
                                    />
                                </td>
                                <td>{row.enabled && (
                                    <SharingStatusCell
                                        state={row.indexState}
                                        indexingAvailable={payload.indexingAvailable}
                                        disabled={saving}
                                        onIndex={() => {
                                            void handleIndex(row.sourceId);
                                        }}
                                    />
                                )}</td>
                                <td>{row.enabled && row.indexState.hasIndex && formatTimestamp(row.indexState.lastIndexedAt)}</td>
                            </tr>
                        ))}
                        {payload.items.modules.length === 0 && (
                            <tr>
                                <td colSpan={5} className='text-muted'>Keine unterstützten Aktivitäten gefunden.</td>
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
                                    <CloseButton aria-label='Close' onClick={closeCreateModal} disabled={saving}/>
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
                                    <CloseButton aria-label='Close' onClick={closeEditModal} disabled={saving}/>
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
                                    <CloseButton aria-label='Close' onClick={closeDeleteModal} disabled={saving}/>
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

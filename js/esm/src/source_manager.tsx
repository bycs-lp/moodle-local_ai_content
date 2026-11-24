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
 * Source management of a course: share activities and documents with AI and make them searchable.
 *
 * @module     local_ai_content/source_manager
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {
    Fragment,
    type ReactNode,
    use,
    useEffect,
    useRef,
    useState,
} from 'react';
import {createPortal} from 'react-dom';
import {
    Badge,
    Button,
    Checkbox,
    ProgressBar,
    Switch,
} from '@moodlehq/design-system';
import {closeModal, openModal, type MoodleModal} from './modal';
import {
    createDocument,
    deleteDocument,
    getIndexStates,
    getSources,
    indexSources,
    setSharing,
    updateDocument,
    type DocumentFields,
    type DocumentSource,
    type IndexState,
    type ModuleSource,
    type SourceOverview,
} from './source_manager/repository';
import {SectionToggle, SelectedCount, SourceLabel} from './source_ui';
import {COMPONENT, pluginString, StringsProvider} from './strings';
import {requireAsync} from '@moodle/lms/core/amd';
import Log from '@moodle/lms/core/log';
import MoodleString from '@moodle/lms/core/String';
import {getString} from '@moodle/lms/core/stringUtils';

type Props = {
    contextid: number;
};

/** Where a document belongs to. */
type Scope = 'course' | 'global';

/** The document edited in the document modal, without id while it is created. */
type DocumentDraft = DocumentFields & {
    id: number | null;
    scope: Scope;
};

/** The parts of the AMD module core/notification used here. */
type NotificationModule = {
    deleteCancelPromise: (title: string, question: string, deleteLabel: string) => Promise<void>;
};

/**
 * Get the message of a failed request: core/fetch rejects with the HTTP status text, other failures with an Error.
 */
const errorMessage = (caught: unknown): string => caught instanceof Error ? caught.message : String(caught);

const isActive = (state: IndexState): boolean => state.status === 'queued' || state.status === 'running';

/** Whether the action indexing a shared source with the embedding model of the current user is offered. */
const canOfferIndexing = (state: IndexState, indexingAvailable: boolean): boolean =>
    indexingAvailable && (!state.hasIndex || (state.canIndexCurrentModel && state.currentModel !== null));

/** Whether a source can be indexed right now with the embedding model of the current user. */
const isIndexable = (enabled: boolean, state: IndexState, indexingAvailable: boolean): boolean =>
    enabled && !isActive(state) && canOfferIndexing(state, indexingAvailable);

/** Return a copy of the set with the ids added or removed. */
const setIds = (current: Set<number>, ids: number[], select: boolean): Set<number> => {
    const next = new Set(current);
    for (const id of ids) {
        if (select) {
            next.add(id);
        } else {
            next.delete(id);
        }
    }

    return next;
};

const formatTimestamp = (timestamp: string | null): string => timestamp === null ? '-' : new Date(timestamp).toLocaleString();

const countSelected = (ids: number[], selected: Set<number>): number => ids.filter(id => selected.has(id)).length;

/**
 * Renders the checkbox selecting or deselecting all given rows, mixed if only some are selected.
 */
function SelectAllCheckbox({id, ids, selected, disabled, label, onChange}: {
    id: string;
    ids: number[];
    selected: Set<number>;
    disabled: boolean;
    /** The name of the selected group, all rows of the table if not given. */
    label?: string;
    onChange: (ids: number[], select: boolean) => void;
}) {
    const count = countSelected(ids, selected);
    const labelText = use(label === undefined ? pluginString('selectall') : pluginString('selector_selectgroup', label));
    return (
        <Checkbox
            id={id}
            checked={count > 0 && count === ids.length}
            indeterminate={count > 0 && count < ids.length}
            disabled={disabled || ids.length === 0}
            onChange={() => {
                onChange(ids, count !== ids.length);
            }}
            hideLabel
            label={labelText}
        />
    );
}

/**
 * Renders the checkbox selecting one row.
 */
function RowCheckbox({id, name, checked, disabled, onChange}: {
    id: string;
    name: string;
    checked: boolean;
    disabled: boolean;
    onChange: () => void;
}) {
    return (
        <Checkbox
            id={id}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            hideLabel
            label={use(pluginString('selectsource', name))}
        />
    );
}

/**
 * Renders the status of a shared source: the indexing state if it has an index, otherwise a hint that it can only be
 * read but not searched; with the action to index it with the embedding model of the current user if offered.
 */
function SharingStatus({state, indexingAvailable, disabled, onIndex}: {
    state: IndexState;
    indexingAvailable: boolean;
    disabled: boolean;
    onIndex: () => void;
}) {
    const active = isActive(state);
    const badgeVariant = state.status === 'failed' ? 'danger' : (state.status === 'outdated' ? 'warning' : 'secondary');
    const indexLabel = use(state.hasIndex && state.currentModel !== null
        ? pluginString('indexwithmymodel', state.currentModel)
        : pluginString('makesearchable'));

    return (
        <>
            {state.hasIndex && (
                <>
                    <Badge variant={badgeVariant} subtle={badgeVariant === 'secondary'} label={state.statusLabel} />
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
                    {state.status === 'failed' && state.message !== '' && (
                        <div className='small text-danger mt-1'>{state.message}</div>
                    )}
                    <ul className='list-unstyled small text-muted mt-1 mb-0'>
                        {state.models.map(model => <li key={model.model}>{model.model}: {model.statusLabel}</li>)}
                    </ul>
                </>
            )}
            {!state.hasIndex && (
                <>
                    <Badge variant='secondary' subtle label={use(pluginString('sharednotsearchable'))} />
                    <div className='small text-muted mt-1'>
                        <MoodleString identifier='sharednotsearchable_desc' component={COMPONENT} />
                    </div>
                </>
            )}
            {canOfferIndexing(state, indexingAvailable) && (
                <Button
                    variant='ghost'
                    size='sm'
                    className='mt-1'
                    label={indexLabel}
                    disabled={disabled || active}
                    onClick={onIndex}
                />
            )}
        </>
    );
}

/**
 * Renders the cells shared by activity and document rows: the sharing switch, the status and the time of indexing.
 */
function SharingCells({id, name, enabled, state, indexingAvailable, disabled, onToggle, onIndex}: {
    id: string;
    name: string;
    enabled: boolean;
    state: IndexState;
    indexingAvailable: boolean;
    disabled: boolean;
    onToggle: () => void;
    onIndex: () => void;
}) {
    return (
        <>
            <td>
                <Switch
                    id={id}
                    checked={enabled}
                    disabled={disabled}
                    onChange={onToggle}
                    hideLabel
                    label={use(pluginString('manager_sharesource', name))}
                />
            </td>
            <td>
                {enabled && (
                    <SharingStatus state={state} indexingAvailable={indexingAvailable} disabled={disabled} onIndex={onIndex} />
                )}
            </td>
            <td className='text-nowrap'>{enabled && state.hasIndex && formatTimestamp(state.lastIndexedAt)}</td>
        </>
    );
}

/**
 * Renders the header cells of a source table.
 */
function TableHeader({checkbox, firstColumnIdentifier, withActions}: {
    checkbox: ReactNode;
    firstColumnIdentifier: string;
    withActions: boolean;
}) {
    return (
        <thead>
            <tr className='border-bottom'>
                <th>{checkbox}</th>
                <th><MoodleString identifier={firstColumnIdentifier} component={COMPONENT} /></th>
                <th><MoodleString identifier='manager_column_shared' component={COMPONENT} /></th>
                <th><MoodleString identifier='status' /></th>
                <th><MoodleString identifier='manager_column_lastindexed' component={COMPONENT} /></th>
                {withActions && <th><MoodleString identifier='actions' /></th>}
            </tr>
        </thead>
    );
}

/**
 * Renders the heading of a group of sources with the number of selected sources, as in the source selector.
 */
function GroupHeader({titleIdentifier, ids, selected, children}: {
    titleIdentifier: string;
    ids: number[];
    selected: Set<number>;
    children?: ReactNode;
}) {
    return (
        <div className='d-flex align-items-center gap-2 pb-1 mb-2 border-bottom'>
            <h5 className='mb-0 flex-grow-1'><MoodleString identifier={titleIdentifier} component={COMPONENT} /></h5>
            {ids.length > 0 && <SelectedCount selected={countSelected(ids, selected)} total={ids.length} />}
            {children}
        </div>
    );
}

/**
 * Renders the actions for the selected sources. Every action only changes the selected sources it applies to.
 */
function BulkActions({
    count, shareCount, stopSharingCount, indexCount, indexingAvailable, disabled, onShare, onStopSharing,
    onIndex,
}: {
    count: number;
    shareCount: number;
    stopSharingCount: number;
    indexCount: number;
    indexingAvailable: boolean;
    disabled: boolean;
    onShare: () => void;
    onStopSharing: () => void;
    onIndex: () => void;
}) {
    return (
        <div
            className='sticky-bottom bg-body d-flex flex-wrap align-items-center gap-2 mt-3 p-2 border rounded shadow-sm'
            role='region'
            aria-label={use(pluginString('bulk_selectedcount', count))}
        >
            <span className='small text-muted'>
                <MoodleString identifier='bulk_selectedcount' component={COMPONENT} params={count} />
            </span>
            <Button
                variant='outline-secondary'
                label={use(pluginString('bulk_share'))}
                disabled={disabled || shareCount === 0}
                onClick={onShare}
            />
            <Button
                variant='outline-secondary'
                label={use(pluginString('bulk_stopsharing'))}
                disabled={disabled || stopSharingCount === 0}
                onClick={onStopSharing}
            />
            {indexingAvailable && (
                <Button
                    variant='outline-secondary'
                    label={use(pluginString('bulk_index'))}
                    disabled={disabled || indexCount === 0}
                    onClick={onIndex}
                />
            )}
        </div>
    );
}

/**
 * Renders the fields of a document, shown in the document modal.
 */
function DocumentForm({draft, showValidation, error, onChange}: {
    draft: DocumentDraft;
    showValidation: boolean;
    error: string | null;
    onChange: (draft: DocumentDraft) => void;
}) {
    const nameInvalid = showValidation && draft.name.trim() === '';
    return (
        <>
            <div className='mb-3'>
                <label className='form-label' htmlFor='local_ai_content-document-name'>
                    <MoodleString identifier='name' />
                </label>
                <input
                    id='local_ai_content-document-name'
                    className={`form-control${nameInvalid ? ' is-invalid' : ''}`}
                    value={draft.name}
                    required
                    onChange={event => {
                        onChange({...draft, name: event.target.value});
                    }}
                />
                {nameInvalid && <div className='invalid-feedback'><MoodleString identifier='required' /></div>}
            </div>
            <div className='mb-3'>
                <label className='form-label' htmlFor='local_ai_content-document-description'>
                    <MoodleString identifier='description' />
                </label>
                <input
                    id='local_ai_content-document-description'
                    className='form-control'
                    value={draft.description}
                    onChange={event => {
                        onChange({...draft, description: event.target.value});
                    }}
                />
            </div>
            <div className='mb-3'>
                <label className='form-label' htmlFor='local_ai_content-document-content'>
                    <MoodleString identifier='content' />
                </label>
                <textarea
                    id='local_ai_content-document-content'
                    className='form-control'
                    rows={10}
                    value={draft.content}
                    onChange={event => {
                        onChange({...draft, content: event.target.value});
                    }}
                />
            </div>
            {error !== null && <div className='alert alert-danger mb-0' role='alert'>{error}</div>}
        </>
    );
}

/**
 * Renders the button opening the modal to create a document.
 */
function CreateDocumentButton({disabled, onClick}: {disabled: boolean; onClick: () => void}) {
    return (
        <Button
            variant='outline-secondary'
            disabled={disabled}
            onClick={onClick}
            startIcon={<i className='icon fa fa-plus' aria-hidden='true' />}
            label={use(pluginString('manager_createdocument'))}
        />
    );
}

/**
 * Renders an icon button acting on a document, labelled with the name of the document.
 */
function DocumentActionButton({labelIdentifier, icon, variant, name, disabled, onClick}: {
    labelIdentifier: string;
    icon: string;
    variant: 'outline-secondary' | 'outline-danger';
    name: string;
    disabled: boolean;
    onClick: () => void;
}) {
    const label = use(pluginString(labelIdentifier, name));
    return (
        <Button
            variant={variant}
            disabled={disabled}
            onClick={onClick}
            aria-label={label}
            title={label}
            startIcon={<i className={`icon fa ${icon} m-0`} aria-hidden='true' />}
        />
    );
}

/**
 * Source management of a course.
 *
 * @param props Component props.
 * @returns The rendered component.
 */
export default function SourceManager(props: Props) {
    return (
        <StringsProvider>
            <SourceManagerContent {...props} />
        </StringsProvider>
    );
}

/**
 * Render the source management once the language strings are preloaded.
 *
 * @param props Component props.
 * @returns The rendered component.
 */
function SourceManagerContent({contextid}: Props) {
    const [payload, setPayload] = useState<SourceOverview | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [pollIntervalMs, setPollIntervalMs] = useState<number>(5000);
    const [selectedCmIds, setSelectedCmIds] = useState<Set<number>>(new Set());
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<number>>(new Set());
    /** The expanded course sections, null until the user expands or collapses a section. */
    const [expandedSections, setExpandedSections] = useState<Set<number> | null>(null);
    const [draft, setDraft] = useState<DocumentDraft | null>(null);
    const [showValidation, setShowValidation] = useState<boolean>(false);
    const [modalBodyRoot, setModalBodyRoot] = useState<HTMLElement | null>(null);
    const modalReference = useRef<MoodleModal | null>(null);
    /** The save handler of the document modal; the modal is created once, but the handler needs the current draft. */
    const saveDocumentReference = useRef<() => void>(() => undefined);
    const loggedDebugInfoReference = useRef<Record<number, string>>({});

    const hasActiveTasks = payload !== null && [
        ...payload.items.modules,
        ...payload.items.globalDocuments,
        ...payload.items.courseDocuments,
    ].some(row => isActive(row.indexState));

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
            Log.debug(`Indexing failed for source ${state.sourceId}:\n${state.debugInfo}`, COMPONENT);
        }
    };

    /** Replace the whole source list. */
    const applyPayload = (data: SourceOverview) => {
        logDebugInfo([
            ...data.items.modules,
            ...data.items.globalDocuments,
            ...data.items.courseDocuments,
        ].map(row => row.indexState));
        setPayload(data);
    };

    /** Update the index states of the listed sources. */
    const applyIndexStates = (states: IndexState[]) => {
        logDebugInfo(states);
        const byId = new Map(states.map(state => [state.sourceId, state]));
        const merge = <T extends {indexState: IndexState}>(row: T, sourceId: number): T => {
            const state = byId.get(sourceId);
            return state ? {...row, indexState: state} : row;
        };

        setPayload(current => current && {
            ...current,
            items: {
                modules: current.items.modules.map(row => merge(row, row.sourceId)),
                globalDocuments: current.items.globalDocuments.map(row => merge(row, row.id)),
                courseDocuments: current.items.courseDocuments.map(row => merge(row, row.id)),
            },
        });
    };

    /**
     * Run a request changing sources, blocking the UI meanwhile and reporting a failure.
     *
     * @param action The request, applying its result.
     * @param errorIdentifier The string reporting a failure, gets the error message as parameter.
     * @returns Whether the request succeeded.
     */
    const runAction = async (action: () => Promise<void>, errorIdentifier = 'manager_actionerror'): Promise<boolean> => {
        setSaving(true);
        setError(null);
        try {
            await action();
            return true;
        } catch (error_) {
            setError(await pluginString(errorIdentifier, errorMessage(error_)));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const share = async (cmIds: number[], documentIds: number[], enabled: boolean): Promise<boolean> =>
        runAction(async () => {
            applyPayload(await setSharing(contextid, cmIds, documentIds, enabled));
        });

    const index = async (sourceIds: number[]): Promise<boolean> =>
        runAction(async () => {
            applyIndexStates(await indexSources(sourceIds));
        }, 'manager_indexerror');

    const openDocumentModal = async (document: DocumentDraft) => {
        setDraft(document);
        setShowValidation(false);
        setError(null);
        const {modal, bodyRoot} = await openModal({
            title: await pluginString(document.id === null ? 'manager_createdocument' : 'manager_editdocument'),
            saveLabel: await getString('savechanges', 'core'),
            onSave() {
                saveDocumentReference.current();
            },
            onHidden() {
                setDraft(null);
                setModalBodyRoot(null);
                modalReference.current = null;
            },
        });
        modalReference.current = modal;
        setModalBodyRoot(bodyRoot);
    };

    const saveDocument = async () => {
        if (draft === null || modalReference.current === null) {
            return;
        }

        if (draft.name.trim() === '') {
            setShowValidation(true);
            return;
        }

        const {id, scope, ...fields} = draft;
        const saved = await runAction(async () => {
            if (id === null) {
                await createDocument(contextid, scope, fields);
                applyPayload(await getSources(contextid));
            } else {
                applyPayload(await updateDocument(contextid, id, fields));
            }
        });
        if (saved) {
            await closeModal(modalReference.current);
        }
    };

    const confirmDeleteDocument = async (document: DocumentSource) => {
        const notification = await requireAsync<NotificationModule>('core/notification');
        try {
            await notification.deleteCancelPromise(
                await pluginString('manager_deletedocument'),
                await pluginString('manager_deletedocument_confirm', document.name),
                await getString('delete', 'core'),
            );
        } catch {
            // Cancelled.
            return;
        }

        await runAction(async () => {
            applyPayload(await deleteDocument(contextid, document.id));
        });
    };

    useEffect(() => {
        saveDocumentReference.current = () => {
            void saveDocument();
        };
    });

    useEffect(() => {
        getSources(contextid)
            .then(applyPayload)
            .catch(async (error_: unknown) => {
                setError(await pluginString('manager_loaderror', errorMessage(error_)));
            });
    }, [contextid]);

    useEffect(() => {
        if (!hasActiveTasks) {
            return undefined;
        }

        const timer = setInterval(() => {
            getIndexStates(contextid)
                .then(data => {
                    setPollIntervalMs(data.pollIntervalSeconds * 1000);
                    applyIndexStates(data.items);
                })
                // A failed poll is repeated with the next interval.
                .catch(() => undefined);
        }, pollIntervalMs);

        return () => {
            clearInterval(timer);
        };
    }, [hasActiveTasks, contextid, pollIntervalMs]);

    useEffect(() => () => {
        if (modalReference.current) {
            void closeModal(modalReference.current);
        }
    }, []);

    if (!payload) {
        return error === null
            ? <div className='text-muted'><MoodleString identifier='loading' /></div>
            : <div className='alert alert-danger' role='alert'>{error}</div>;
    }

    const {modules, courseDocuments, globalDocuments} = payload.items;
    // Only rows still present and editable count, e.g. a selected document may have been deleted meanwhile.
    const editableDocuments = [...courseDocuments, ...globalDocuments].filter(row => row.canEdit);
    const selectedModules = modules.filter(row => selectedCmIds.has(row.cmId));
    const selectedDocuments = editableDocuments.filter(row => selectedDocumentIds.has(row.id));
    const selectedRows = [...selectedModules, ...selectedDocuments.map(row => ({...row, sourceId: row.id}))];
    const indexableSourceIds = selectedRows
        .filter(row => isIndexable(row.enabled, row.indexState, payload.indexingAvailable))
        .map(row => row.sourceId);
    const cmIds = modules.map(row => row.cmId);

    const sectionsWithModules = payload.courseSections
        .map(section => ({section, rows: modules.filter(row => row.sectionId === section.id)}))
        .filter(entry => entry.rows.length > 0);
    // As in the source selector, a single section is expanded; otherwise the sections with shared activities.
    const expanded = expandedSections ?? new Set(sectionsWithModules
        .filter(entry => sectionsWithModules.length === 1 || entry.rows.some(row => row.enabled))
        .map(entry => entry.section.id));

    const clearSelection = () => {
        setSelectedCmIds(new Set());
        setSelectedDocumentIds(new Set());
    };

    const bulkShare = async (enabled: boolean) => {
        const changed = await share(
            selectedModules.filter(row => row.enabled !== enabled).map(row => row.cmId),
            selectedDocuments.filter(row => row.enabled !== enabled).map(row => row.id),
            enabled,
        );
        if (changed) {
            clearSelection();
        }
    };

    const bulkIndex = async () => {
        if (await index(indexableSourceIds)) {
            clearSelection();
        }
    };

    const renderModuleRow = (row: ModuleSource) => (
        <tr key={row.cmId}>
            <td>
                <RowCheckbox
                    id={`module-select-${row.cmId}`}
                    name={row.name}
                    checked={selectedCmIds.has(row.cmId)}
                    disabled={saving}
                    onChange={() => {
                        setSelectedCmIds(current => setIds(current, [row.cmId], !current.has(row.cmId)));
                    }}
                />
            </td>
            <td>
                <SourceLabel
                    htmlFor={`module-select-${row.cmId}`}
                    iconUrl={row.iconUrl}
                    name={row.name}
                    details={row.modDisplayName}
                />
            </td>
            <SharingCells
                id={`module-enabled-${row.cmId}`}
                name={row.name}
                enabled={row.enabled}
                state={row.indexState}
                indexingAvailable={payload.indexingAvailable}
                disabled={saving}
                onToggle={() => {
                    void share([row.cmId], [], !row.enabled);
                }}
                onIndex={() => {
                    void index([row.sourceId]);
                }}
            />
        </tr>
    );

    const renderDocumentRow = (row: DocumentSource, scope: Scope) => (
        <tr key={row.id}>
            <td>
                {row.canEdit && (
                    <RowCheckbox
                        id={`document-select-${row.id}`}
                        name={row.name}
                        checked={selectedDocumentIds.has(row.id)}
                        disabled={saving}
                        onChange={() => {
                            setSelectedDocumentIds(current => setIds(current, [row.id], !current.has(row.id)));
                        }}
                    />
                )}
            </td>
            <td>
                <SourceLabel htmlFor={`document-select-${row.id}`} iconUrl='' name={row.name} details={row.description} />
            </td>
            <SharingCells
                id={`document-enabled-${row.id}`}
                name={row.name}
                enabled={row.enabled}
                state={row.indexState}
                indexingAvailable={payload.indexingAvailable}
                disabled={saving || !row.canEdit}
                onToggle={() => {
                    void share([], [row.id], !row.enabled);
                }}
                onIndex={() => {
                    void index([row.id]);
                }}
            />
            <td>
                {row.canEdit && (
                    <div className='d-flex gap-1'>
                        <DocumentActionButton
                            labelIdentifier='manager_editsource'
                            icon='fa-pencil'
                            variant='outline-secondary'
                            name={row.name}
                            disabled={saving}
                            onClick={() => {
                                const {id, name, description, content} = row;
                                void openDocumentModal({
                                    id, scope, name, description, content,
                                });
                            }}
                        />
                        <DocumentActionButton
                            labelIdentifier='manager_deletesource'
                            icon='fa-trash'
                            variant='outline-danger'
                            name={row.name}
                            disabled={saving}
                            onClick={() => {
                                void confirmDeleteDocument(row);
                            }}
                        />
                    </div>
                )}
            </td>
        </tr>
    );

    const renderDocumentGroup = ({scope, titleIdentifier, hintIdentifier, emptyIdentifier, rows, canCreate}: {
        scope: Scope;
        titleIdentifier: string;
        hintIdentifier: string;
        emptyIdentifier: string;
        rows: DocumentSource[];
        canCreate: boolean;
    }) => {
        const editableIds = rows.filter(row => row.canEdit).map(row => row.id);
        return (
            <section className='mb-4'>
                <GroupHeader titleIdentifier={titleIdentifier} ids={editableIds} selected={selectedDocumentIds}>
                    {canCreate && (
                        <CreateDocumentButton
                            disabled={saving}
                            onClick={() => {
                                void openDocumentModal({
                                    id: null, scope, name: '', description: '', content: '',
                                });
                            }}
                        />
                    )}
                </GroupHeader>
                <div className='small text-muted mb-2'>
                    <MoodleString identifier={hintIdentifier} component={COMPONENT} />
                </div>
                {rows.length === 0 && (
                    <div className='text-muted small mb-2'><MoodleString identifier={emptyIdentifier} component={COMPONENT} /></div>
                )}
                {rows.length > 0 && (
                    <table className='table table-sm table-hover table-borderless align-middle'>
                        <TableHeader
                            firstColumnIdentifier='manager_column_document'
                            withActions
                            checkbox={editableIds.length > 0 && (
                                <SelectAllCheckbox
                                    id={`document-select-all-${scope}`}
                                    ids={editableIds}
                                    selected={selectedDocumentIds}
                                    disabled={saving}
                                    onChange={(ids, select) => {
                                        setSelectedDocumentIds(current => setIds(current, ids, select));
                                    }}
                                />
                            )}
                        />
                        <tbody>{rows.map(row => renderDocumentRow(row, scope))}</tbody>
                    </table>
                )}
            </section>
        );
    };

    return (
        <div className='local_ai_content-source-manager'>
            {payload.indexingUnavailableReason !== null && (
                <div className='alert alert-info' role='status'>
                    <MoodleString
                        identifier={payload.indexingUnavailableReason === 'novecstore'
                            ? 'indexingnotavailable_novecstore'
                            : 'searchnotavailable'}
                        component={COMPONENT}
                    />
                </div>
            )}

            <section className='mb-4'>
                <GroupHeader titleIdentifier='selector_courseactivities' ids={cmIds} selected={selectedCmIds} />
                <div className='small text-muted mb-2'>
                    <MoodleString identifier='manager_activitieshint' component={COMPONENT} />
                </div>
                <table className='table table-sm table-hover table-borderless align-middle'>
                    <TableHeader
                        firstColumnIdentifier='manager_column_activity'
                        withActions={false}
                        checkbox={(
                            <SelectAllCheckbox
                                id='module-select-all'
                                ids={cmIds}
                                selected={selectedCmIds}
                                disabled={saving}
                                onChange={(ids, select) => {
                                    setSelectedCmIds(current => setIds(current, ids, select));
                                }}
                            />
                        )}
                    />
                    <tbody>
                        {sectionsWithModules.length === 0 && modules.map(row => renderModuleRow(row))}
                        {sectionsWithModules.map(({section, rows}) => {
                            const ids = rows.map(row => row.cmId);
                            const isExpanded = expanded.has(section.id);
                            return (
                                <Fragment key={section.id}>
                                    <tr className='border-top'>
                                        <td>
                                            <SelectAllCheckbox
                                                id={`module-select-section-${section.id}`}
                                                ids={ids}
                                                selected={selectedCmIds}
                                                disabled={saving}
                                                label={section.name}
                                                onChange={(changedIds, select) => {
                                                    setSelectedCmIds(current => setIds(current, changedIds, select));
                                                }}
                                            />
                                        </td>
                                        <td colSpan={4}>
                                            <div className='d-flex align-items-center gap-2'>
                                                <SectionToggle
                                                    name={section.name}
                                                    expanded={isExpanded}
                                                    onToggle={() => {
                                                        setExpandedSections(setIds(expanded, [section.id], !isExpanded));
                                                    }}
                                                />
                                                <SelectedCount selected={countSelected(ids, selectedCmIds)} total={ids.length} />
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && rows.map(row => renderModuleRow(row))}
                                </Fragment>
                            );
                        })}
                        {modules.length === 0 && (
                            <tr>
                                <td colSpan={5} className='text-muted'>
                                    <MoodleString identifier='manager_noactivities' component={COMPONENT} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            {renderDocumentGroup({
                scope: 'course',
                titleIdentifier: 'selector_coursedocuments',
                hintIdentifier: 'manager_coursedocumentshint',
                emptyIdentifier: 'selector_nocoursedocuments',
                rows: courseDocuments,
                canCreate: true,
            })}
            {renderDocumentGroup({
                scope: 'global',
                titleIdentifier: 'selector_globaldocuments',
                hintIdentifier: 'manager_globaldocumentshint',
                emptyIdentifier: 'selector_noglobaldocuments',
                rows: globalDocuments,
                canCreate: payload.canManageGlobalSources,
            })}

            {error !== null && modalBodyRoot === null && <div className='alert alert-danger' role='alert'>{error}</div>}

            {selectedRows.length > 0 && (
                <BulkActions
                    count={selectedRows.length}
                    shareCount={selectedRows.filter(row => !row.enabled).length}
                    stopSharingCount={selectedRows.filter(row => row.enabled).length}
                    indexCount={indexableSourceIds.length}
                    indexingAvailable={payload.indexingAvailable}
                    disabled={saving}
                    onShare={() => {
                        void bulkShare(true);
                    }}
                    onStopSharing={() => {
                        void bulkShare(false);
                    }}
                    onIndex={() => {
                        void bulkIndex();
                    }}
                />
            )}

            {draft !== null && modalBodyRoot !== null && createPortal(
                <DocumentForm draft={draft} showValidation={showValidation} error={error} onChange={setDraft} />,
                modalBodyRoot,
            )}
        </div>
    );
}


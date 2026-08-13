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

import {useEffect, useMemo, useRef, useState} from 'react';
import Fetch from '@moodle/lms/core/fetch';
// @ts-ignore - path resolved via Moodle import map at runtime
import {Button, ProgressBar} from '@moodlehq/design-system';

type ModuleSource = {
    cmid: number;
    modname: string;
    moddisplayname: string;
    name: string;
    sourceid: number;
    enabled: boolean;
    allowindex: boolean;
    indexstatus: string;
    indexstatuslabel: string;
    lastindexed: string | null;
    indextaskid: number;
    progressrecordid: number;
    progresspercent: number;
    progressmessage: string;
    progresserror: boolean;
};

type DocumentSource = {
    id: number;
    name: string;
    description: string;
    content: string;
    enabled: boolean;
    allowindex: boolean;
    indexstatus: string;
    indexstatuslabel: string;
    lastindexed: string | null;
    indextaskid: number;
    progressrecordid: number;
    progresspercent: number;
    progressmessage: string;
    progresserror: boolean;
    canedit: boolean;
};

type SourceManagementApiResponse = {
    coursecontextid: number;
    canmanagesystemsources: boolean;
    items?: {
        modules?: Array<Record<string, unknown>>;
        globaldocuments?: Array<Record<string, unknown>>;
        coursedocuments?: Array<Record<string, unknown>>;
    };
    modules?: Array<Record<string, unknown>>;
    globaldocuments?: Array<Record<string, unknown>>;
    coursedocuments?: Array<Record<string, unknown>>;
};

type SourceManagementResponse = {
    coursecontextid: number;
    canmanagesystemsources: boolean;
    modules: ModuleSource[];
    globaldocuments: DocumentSource[];
    coursedocuments: DocumentSource[];
};

type SourceProgressItem = {
    sourceid: number;
    sourcetype: string;
    cmid: number;
    indexstatus: string;
    indexstatuslabel: string;
    indextaskid: number;
    lastIndexedAt: string | null;
    progressrecordid: number;
    progresspercent: number;
    progressmessage: string;
    progresserror: boolean;
};

type SourceProgressResponse = {
    items: SourceProgressItem[];
    pollIntervalSeconds?: number;
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

const DEFAULT_PROGRESS_POLL_MS = 5000;

function normalizeProgressPollMs(timeoutseconds?: number): number {
    if (!Number.isFinite(timeoutseconds)) {
        return DEFAULT_PROGRESS_POLL_MS;
    }

    // Keep polling within reasonable bounds even if backend config is misconfigured.
    const secondssafe = Math.max(1, Math.min(60, Math.round(timeoutseconds ?? 5)));
    return secondssafe * 1000;
}

function formatTimestamp(timestamp?: string | null): string {
    if (!timestamp) {
        return '-';
    }

    const parsed = new Date(timestamp);
    if (isNaN(parsed.getTime())) {
        return '-';
    }

    return parsed.toLocaleString();
}

function normalizeManagementResponse(data: SourceManagementApiResponse): SourceManagementResponse {
    const sourceitems = data.items ?? {};
    const normalizemodule = (raw: Record<string, unknown>): ModuleSource => ({
        cmid: Number(raw.cmid ?? 0),
        modname: String(raw.modname ?? ''),
        moddisplayname: String(raw.moddisplayname ?? ''),
        name: String(raw.name ?? ''),
        sourceid: Number(raw.sourceid ?? 0),
        enabled: Boolean(raw.enabled ?? false),
        allowindex: Boolean(raw.allowindex ?? false),
        indexstatus: String(raw.indexstatus ?? ''),
        indexstatuslabel: String(raw.indexstatuslabel ?? ''),
        lastindexed: (raw.lastindexed as string | null | undefined) ?? (raw.lastIndexedAt as string | null | undefined) ?? null,
        indextaskid: Number(raw.indextaskid ?? 0),
        progressrecordid: Number(raw.progressrecordid ?? 0),
        progresspercent: Number(raw.progresspercent ?? 0),
        progressmessage: String(raw.progressmessage ?? ''),
        progresserror: Boolean(raw.progresserror ?? false),
    });
    const normalizedocument = (raw: Record<string, unknown>): DocumentSource => ({
        id: Number(raw.id ?? 0),
        name: String(raw.name ?? ''),
        description: String(raw.description ?? ''),
        content: String(raw.content ?? ''),
        enabled: Boolean(raw.enabled ?? false),
        allowindex: Boolean(raw.allowindex ?? false),
        indexstatus: String(raw.indexstatus ?? ''),
        indexstatuslabel: String(raw.indexstatuslabel ?? ''),
        lastindexed: (raw.lastindexed as string | null | undefined) ?? (raw.lastIndexedAt as string | null | undefined) ?? null,
        indextaskid: Number(raw.indextaskid ?? 0),
        progressrecordid: Number(raw.progressrecordid ?? 0),
        progresspercent: Number(raw.progresspercent ?? 0),
        progressmessage: String(raw.progressmessage ?? ''),
        progresserror: Boolean(raw.progresserror ?? false),
        canedit: Boolean(raw.canedit ?? false),
    });

    const modules = (sourceitems.modules ?? data.modules ?? []).map((item) => normalizemodule(item));
    const globaldocuments = (sourceitems.globaldocuments ?? data.globaldocuments ?? []).map((item) => normalizedocument(item));
    const coursedocuments = (sourceitems.coursedocuments ?? data.coursedocuments ?? []).map((item) => normalizedocument(item));

    return {
        coursecontextid: data.coursecontextid,
        canmanagesystemsources: data.canmanagesystemsources,
        modules,
        globaldocuments,
        coursedocuments,
    };
}

function isActiveStatus(status: string): boolean {
    return status === 'queued' || status === 'running';
}

function shouldRenderProgress(status: string, progressrecordid: number, indextaskid: number): boolean {
    return isActiveStatus(status) || progressrecordid > 0 || indextaskid > 0;
}

function StoredProgress({percent, message, error, active}: {
    percent: number;
    message: string;
    error: boolean;
    active: boolean;
}) {
    const normalized = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
    const visiblepercent = active && normalized === 0 ? 2 : normalized;
    const status = error ? 'error' : active ? 'loading' : 'in-progress';

    return (
        <div className="mt-1">
            <ProgressBar
                value={visiblepercent}
                min={0}
                max={100}
                status={status}
                labelVariant="none"
                title={message || 'Indexing progress'}
                count={`${Math.round(normalized)}%`}
                animated={active}
            />
            {(message || error) && (
                <div className={`small ${error ? 'text-danger' : 'text-muted'} mt-1`}>{message}</div>
            )}
        </div>
    );
}

function mergeProgressData(payload: SourceManagementResponse, items: SourceProgressItem[]): SourceManagementResponse {
    const updates = new Map<number, SourceProgressItem>();
    items.forEach((item) => updates.set(item.sourceid, item));

    return {
        ...payload,
        modules: payload.modules.map((row) => {
            const update = updates.get(row.sourceid);
            if (!update) {
                return row;
            }
            return {
                ...row,
                indexstatus: update.indexstatus,
                indexstatuslabel: update.indexstatuslabel,
                indextaskid: update.indextaskid,
                lastindexed: update.lastIndexedAt,
                progressrecordid: update.progressrecordid,
                progresspercent: update.progresspercent,
                progressmessage: update.progressmessage,
                progresserror: update.progresserror,
            };
        }),
        globaldocuments: payload.globaldocuments.map((row) => {
            const update = updates.get(row.id);
            if (!update) {
                return row;
            }
            return {
                ...row,
                indexstatus: update.indexstatus,
                indexstatuslabel: update.indexstatuslabel,
                indextaskid: update.indextaskid,
                lastindexed: update.lastIndexedAt,
                progressrecordid: update.progressrecordid,
                progresspercent: update.progresspercent,
                progressmessage: update.progressmessage,
                progresserror: update.progresserror,
            };
        }),
        coursedocuments: payload.coursedocuments.map((row) => {
            const update = updates.get(row.id);
            if (!update) {
                return row;
            }
            return {
                ...row,
                indexstatus: update.indexstatus,
                indexstatuslabel: update.indexstatuslabel,
                indextaskid: update.indextaskid,
                lastindexed: update.lastIndexedAt,
                progressrecordid: update.progressrecordid,
                progresspercent: update.progresspercent,
                progressmessage: update.progressmessage,
                progresserror: update.progresserror,
            };
        }),
    };
}

export default function SourceManager({contextid}: Props) {
    const [payload, setPayload] = useState<SourceManagementResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [editingDocument, setEditingDocument] = useState<EditableDocument | null>(null);
    const [deleteCandidate, setDeleteCandidate] = useState<DocumentTableRow | null>(null);
    const [createScope, setCreateScope] = useState<'global' | 'course' | null>(null);
    const [newDocument, setNewDocument] = useState<EditableDocument>({id: 0, name: '', description: '', content: ''});
    const [progressPollMs, setProgressPollMs] = useState<number>(DEFAULT_PROGRESS_POLL_MS);

    const plusIcon = <i className="icon fa fa-plus" aria-hidden="true" />;
    const refreshInFlightRef = useRef<boolean>(false);

    const documentRows = useMemo<DocumentTableRow[]>(() => {
        if (!payload) {
            return [];
        }
        const globalrows = payload.globaldocuments.map((row) => ({...row, scope: 'global' as const}));
        const courserows = payload.coursedocuments.map((row) => ({...row, scope: 'course' as const}));
        return [...globalrows, ...courserows].sort((a, b) => a.name.localeCompare(b.name));
    }, [payload]);

    const hasActiveTasks = useMemo(() => {
        if (!payload) {
            return false;
        }
        const modulesActive = payload.modules.some((row) =>
            shouldRenderProgress(row.indexstatus, row.progressrecordid, row.indextaskid)
        );
        const globalActive = payload.globaldocuments.some((row) =>
            shouldRenderProgress(row.indexstatus, row.progressrecordid, row.indextaskid)
        );
        const courseActive = payload.coursedocuments.some((row) =>
            shouldRenderProgress(row.indexstatus, row.progressrecordid, row.indextaskid)
        );
        return modulesActive || globalActive || courseActive;
    }, [payload]);

    const loadPayload = async(background = false) => {
        if (background && refreshInFlightRef.current) {
            return;
        }
        if (!background) {
            setLoading(true);
        } else {
            refreshInFlightRef.current = true;
        }
        setError(null);
        try {
            const res = await Fetch.performGet('local_ai_content', `contexts/${contextid}/sources`);
            const data = await res.json() as SourceManagementApiResponse;
            setPayload(normalizeManagementResponse(data));
        } catch {
            setError('Die Quellen konnten nicht geladen werden.');
        } finally {
            if (!background) {
                setLoading(false);
            } else {
                refreshInFlightRef.current = false;
            }
        }
    };

    const loadProgress = async() => {
        try {
            const res = await Fetch.performGet('local_ai_content', `contexts/${contextid}/source-progresses`);
            const data = await res.json() as SourceProgressResponse;
            setProgressPollMs(normalizeProgressPollMs(data.pollIntervalSeconds));
            setPayload((current) => {
                if (!current) {
                    return current;
                }
                return mergeProgressData(current, data.items ?? []);
            });
        } catch {
            // Keep last known progress state and let regular interactions surface blocking errors.
        }
    };

    const performWrite = async(method: string, path: string, body?: Record<string, unknown>) => {
        setSaving(true);
        setError(null);
        try {
            const res = await Fetch.request('local_ai_content', path, {
                method,
                body,
            });
            if (!res.ok) {
                setError(`Speichern fehlgeschlagen (HTTP ${res.status}).`);
                return false;
            }
            await loadPayload(true);
            return true;
        } catch {
            setError('Die Aktion konnte nicht ausgeführt werden.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        loadPayload();
    }, [contextid]);

    useEffect(() => {
        let timer: number | null = null;
        if (hasActiveTasks) {
            timer = window.setInterval(() => {
                void loadProgress();
            }, progressPollMs);
        }
        return () => {
            if (timer !== null) {
                window.clearInterval(timer);
            }
        };
    }, [hasActiveTasks, contextid, progressPollMs]);

    const handleModuleEnabledToggle = async(row: ModuleSource, enabled: boolean) => {
        await performWrite('PATCH', `contexts/${contextid}/module-sources/${row.cmid}`, {enabled});
    };

    const handleModuleAllowIndexToggle = async(row: ModuleSource, allowindex: boolean) => {
        await performWrite('PATCH', `contexts/${contextid}/module-sources/${row.cmid}`, {allowIndex: allowindex});
    };

    const handleDocumentEnabledToggle = async(row: DocumentTableRow, enabled: boolean) => {
        await performWrite('PATCH', `contexts/${contextid}/document-sources/${row.id}`, {enabled});
    };

    const handleDocumentAllowIndexToggle = async(row: DocumentTableRow, allowindex: boolean) => {
        await performWrite('PATCH', `contexts/${contextid}/document-sources/${row.id}`, {allowIndex: allowindex});
    };

    const openCreateModal = () => {
        setError(null);
        setCreateScope('course');
        setNewDocument({id: 0, name: '', description: '', content: ''});
    };

    const closeCreateModal = () => {
        setCreateScope(null);
    };

    const handleCreateDocument = async() => {
        if (!createScope) {
            return;
        }
        if (!newDocument.name.trim()) {
            setError('Bitte einen Namen für das Dokument angeben.');
            return;
        }
        const saved = await performWrite('POST', `contexts/${contextid}/document-sources`, {
            scope: createScope,
            name: newDocument.name,
            description: newDocument.description,
            content: newDocument.content,
        });
        if (saved) {
            setCreateScope(null);
        }
    };

    const handleUpdateDocument = async() => {
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

    const handleDeleteDocument = async() => {
        if (!deleteCandidate) {
            return;
        }
        const deleted = await performWrite('DELETE', `contexts/${contextid}/document-sources/${deleteCandidate.id}`);
        if (deleted) {
            setDeleteCandidate(null);
        }
    };

    const renderDocumentTable = (rows: DocumentTableRow[]) => (
        <section className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Dokumente</h5>
                <Button
                    type="button"
                    variant="primary"
                    disabled={saving}
                    onClick={openCreateModal}
                    startIcon={plusIcon}
                    label="Dokument anlegen"
                />
            </div>
            <table className="table table-sm table-striped">
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
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>{row.description || '-'}</td>
                            <td>
                                {row.scope === 'global' ? (
                                    <i className="icon fa fa-globe" aria-label="Globale Quelle" title="Globale Quelle" />
                                ) : (
                                    <i className="icon fa fa-graduation-cap" aria-label="Kursquelle" title="Kursquelle" />
                                )}
                            </td>
                            <td>
                                <div className="form-check form-switch m-0">
                                    <input
                                        id={`document-enabled-${row.id}`}
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        checked={row.enabled}
                                        disabled={saving || !row.canedit}
                                        onChange={() => handleDocumentEnabledToggle(row, !row.enabled)}
                                        aria-label={`Dokument ${row.name} für KI-Zugriff aktivieren`}
                                    />
                                </div>
                            </td>
                            <td>
                                <div className="form-check form-switch m-0">
                                    <input
                                        id={`document-index-${row.id}`}
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        checked={row.allowindex}
                                        disabled={saving || !row.enabled || !row.canedit}
                                        onChange={() => handleDocumentAllowIndexToggle(row, !row.allowindex)}
                                        aria-label={`Dokument ${row.name} in Vektorstore indizieren`}
                                    />
                                </div>
                            </td>
                            <td>
                                <span className="badge badge-light">{row.indexstatuslabel}</span>
                                {shouldRenderProgress(row.indexstatus, row.progressrecordid, row.indextaskid) && (
                                    <StoredProgress
                                        percent={row.progresspercent}
                                        message={row.progressmessage || row.indexstatuslabel}
                                        error={row.progresserror}
                                        active={isActiveStatus(row.indexstatus)}
                                    />
                                )}
                            </td>
                            <td>{formatTimestamp(row.lastindexed)}</td>
                            <td>
                                {row.canedit && (
                                    <div className="d-flex gap-1">
                                        <button
                                            type="button"
                                            className="btn btn-link p-0"
                                            disabled={saving}
                                            onClick={() => setEditingDocument({
                                                id: row.id,
                                                name: row.name,
                                                description: row.description,
                                                content: row.content,
                                            })}
                                            aria-label={`Dokument ${row.name} bearbeiten`}
                                            title="Bearbeiten"
                                        >
                                            <i className="icon fa fa-pencil" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-link text-danger p-0"
                                            disabled={saving}
                                            onClick={() => setDeleteCandidate(row)}
                                            aria-label={`Dokument ${row.name} löschen`}
                                            title="Löschen"
                                        >
                                            <i className="icon fa fa-trash" aria-hidden="true" />
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={8} className="text-muted">Keine Dokumente vorhanden.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    );

    if (loading) {
        return <div className="local-ai-content-source-manager local-ai-content-source-manager--loading">Lade Quellen...</div>;
    }

    if (!payload) {
        return <div className="text-danger">Keine Daten verfügbar.</div>;
    }

    return (
        <div className="local-ai-content-source-manager">
            {renderDocumentTable(documentRows)}

            <section className="mb-4">
                <h5>Aktivitäten dieses Kurses</h5>
                <table className="table table-sm table-hover">
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
                        {payload.modules.map((row) => (
                            <tr key={row.cmid}>
                                <td>{row.name}</td>
                                <td>{row.moddisplayname || row.modname}</td>
                                <td>
                                    <div className="form-check form-switch m-0">
                                        <input
                                            id={`module-enabled-${row.cmid}`}
                                            className="form-check-input"
                                            type="checkbox"
                                            role="switch"
                                            checked={row.enabled}
                                            disabled={saving}
                                            onChange={() => handleModuleEnabledToggle(row, !row.enabled)}
                                            aria-label={`Aktivität ${row.name} für KI-Zugriff aktivieren`}
                                        />
                                    </div>
                                </td>
                                <td>
                                    <div className="form-check form-switch m-0">
                                        <input
                                            id={`module-index-${row.cmid}`}
                                            className="form-check-input"
                                            type="checkbox"
                                            role="switch"
                                            checked={row.allowindex}
                                            disabled={saving || !row.enabled}
                                            onChange={() => handleModuleAllowIndexToggle(row, !row.allowindex)}
                                            aria-label={`Aktivität ${row.name} in Vektorstore indizieren`}
                                        />
                                    </div>
                                </td>
                                <td>
                                    <span className="badge badge-light">{row.indexstatuslabel}</span>
                                    {shouldRenderProgress(row.indexstatus, row.progressrecordid, row.indextaskid) && (
                                        <StoredProgress
                                            percent={row.progresspercent}
                                            message={row.progressmessage || row.indexstatuslabel}
                                            error={row.progresserror}
                                            active={isActiveStatus(row.indexstatus)}
                                        />
                                    )}
                                </td>
                                <td>{formatTimestamp(row.lastindexed)}</td>
                            </tr>
                        ))}
                        {payload.modules.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-muted">Keine unterstützten Aktivitäten gefunden.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="small text-muted">
                    Hier werden nur Aktivitäten angezeigt, deren Typ aktuell vom Plugin unterstützt wird.
                </div>
            </section>

            {createScope !== null && (
                <>
                    <div
                        className="modal fade show d-block"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="source-create-modal-title"
                    >
                        <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 id="source-create-modal-title" className="modal-title">Neues Dokument anlegen</h5>
                                    <button
                                        type="button"
                                        className="close"
                                        aria-label="Close"
                                        onClick={closeCreateModal}
                                        disabled={saving}
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {payload.canmanagesystemsources && (
                                        <div className="form-group">
                                            <label htmlFor="source-create-scope">Quelle anlegen in</label>
                                            <select
                                                id="source-create-scope"
                                                className="custom-select"
                                                value={createScope ?? 'course'}
                                                onChange={(e) => setCreateScope(e.target.value === 'global' ? 'global' : 'course')}
                                            >
                                                <option value="course">Diesem Kurs</option>
                                                <option value="global">Systemkontext (global)</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Name</label>
                                        <input
                                            className="form-control form-control-sm"
                                            value={newDocument.name}
                                            onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Beschreibung</label>
                                        <input
                                            className="form-control form-control-sm"
                                            value={newDocument.description}
                                            onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label>Inhalt</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            rows={8}
                                            value={newDocument.content}
                                            onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={saving}
                                        onClick={closeCreateModal}
                                        label="Abbrechen"
                                    />
                                    <Button
                                        type="button"
                                        variant="primary"
                                        disabled={saving}
                                        onClick={handleCreateDocument}
                                        label="Dokument anlegen"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeCreateModal} />
                </>
            )}

            {editingDocument && (
                <>
                    <div
                        className="modal fade show d-block"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="source-edit-modal-title"
                    >
                        <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 id="source-edit-modal-title" className="modal-title">Dokument bearbeiten</h5>
                                    <button
                                        type="button"
                                        className="close"
                                        aria-label="Close"
                                        onClick={() => setEditingDocument(null)}
                                        disabled={saving}
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Name</label>
                                        <input
                                            className="form-control form-control-sm"
                                            value={editingDocument.name}
                                            onChange={(e) => setEditingDocument({...editingDocument, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Beschreibung</label>
                                        <input
                                            className="form-control form-control-sm"
                                            value={editingDocument.description}
                                            onChange={(e) => setEditingDocument({...editingDocument, description: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label>Inhalt</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            rows={8}
                                            value={editingDocument.content}
                                            onChange={(e) => setEditingDocument({...editingDocument, content: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={saving}
                                        onClick={() => setEditingDocument(null)}
                                        label="Abbrechen"
                                    />
                                    <Button
                                        type="button"
                                        variant="primary"
                                        disabled={saving}
                                        onClick={handleUpdateDocument}
                                        label="Speichern"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={() => setEditingDocument(null)} />
                </>
            )}

            {deleteCandidate && (
                <>
                    <div
                        className="modal fade show d-block"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="source-delete-modal-title"
                    >
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 id="source-delete-modal-title" className="modal-title">Quelle löschen</h5>
                                    <button
                                        type="button"
                                        className="close"
                                        aria-label="Close"
                                        onClick={() => setDeleteCandidate(null)}
                                        disabled={saving}
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    Möchtest du die Quelle „{deleteCandidate.name}“ wirklich löschen?
                                </div>
                                <div className="modal-footer">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={saving}
                                        onClick={() => setDeleteCandidate(null)}
                                        label="Abbrechen"
                                    />
                                    <Button
                                        type="button"
                                        variant="danger"
                                        disabled={saving}
                                        onClick={handleDeleteDocument}
                                        label="Löschen"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={() => setDeleteCandidate(null)} />
                </>
            )}

            {error && <div className="text-danger small mt-2">{error}</div>}
        </div>
    );
}


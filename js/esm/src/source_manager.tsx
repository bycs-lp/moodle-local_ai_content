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

import {useEffect, useMemo, useState} from 'react';
import Fetch from '@moodle/lms/core/fetch';
// @ts-ignore - path resolved via Moodle import map at runtime
import {Button} from '@moodlehq/design-system';

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
    lastindexed: number;
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
    indexstatus: string;
    indexstatuslabel: string;
    lastindexed: number;
    indextaskid: number;
    progressrecordid: number;
    progresspercent: number;
    progressmessage: string;
    progresserror: boolean;
    canedit: boolean;
};

type ImportableCourse = {
    id: number;
    name: string;
    shortname: string;
};

type ImportableSource = {
    key: string;
    type: string;
    name: string;
    meta: string;
};

type SourceManagementResponse = {
    coursecontextid: number;
    canmanagesystemsources: boolean;
    importablecourses: ImportableCourse[];
    modules: ModuleSource[];
    globaldocuments: DocumentSource[];
    coursedocuments: DocumentSource[];
};

type SaveActionPayload = {
    action: string;
    cmid?: number;
    sourceid?: number;
    enabled?: boolean;
    allowindex?: boolean;
    scope?: string;
    name?: string;
    description?: string;
    content?: string;
    sourcecourseid?: number;
    selectedimportkeys?: string[];
    sesskey?: string;
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

function formatTimestamp(timestamp: number): string {
    if (!timestamp || timestamp <= 0) {
        return '-';
    }
    return new Date(timestamp * 1000).toLocaleString();
}

function isActiveStatus(status: string): boolean {
    return status === 'queued' || status === 'running';
}

function StoredProgress({percent, message, error}: {percent: number; message: string; error: boolean}) {
    const normalized = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
    const barClass = error ? 'bg-danger' : 'bg-primary';

    return (
        <div className="mt-1">
            <div className="progress" style={{height: '0.65rem'}}>
                <div
                    className={`progress-bar ${barClass}`}
                    role="progressbar"
                    style={{width: `${normalized}%`}}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={normalized}
                />
            </div>
            {(message || error) && (
                <div className={`small ${error ? 'text-danger' : 'text-muted'} mt-1`}>{message}</div>
            )}
        </div>
    );
}

function getSesskey(): string {
    const moodle = window as unknown as {M?: {cfg?: {sesskey?: string}}};
    return moodle.M?.cfg?.sesskey ?? '';
}

export default function SourceManager({contextid}: Props) {
    const [payload, setPayload] = useState<SourceManagementResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [editingDocument, setEditingDocument] = useState<EditableDocument | null>(null);
    const [createScope, setCreateScope] = useState<'global' | 'course' | null>(null);
    const [newDocument, setNewDocument] = useState<EditableDocument>({id: 0, name: '', description: '', content: ''});

    const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
    const [importStep, setImportStep] = useState<1 | 2>(1);
    const [importCourseId, setImportCourseId] = useState<number>(0);
    const [importables, setImportables] = useState<ImportableSource[]>([]);
    const [selectedImportKeys, setSelectedImportKeys] = useState<Set<string>>(new Set());

    const plusIcon = <i className="icon fa fa-plus" aria-hidden="true" />;

    const hasActiveTasks = useMemo(() => {
        if (!payload) {
            return false;
        }
        const modulesActive = payload.modules.some((row) => isActiveStatus(row.indexstatus) && row.progressrecordid > 0);
        const globalActive = payload.globaldocuments.some((row) => isActiveStatus(row.indexstatus) && row.progressrecordid > 0);
        const courseActive = payload.coursedocuments.some((row) => isActiveStatus(row.indexstatus) && row.progressrecordid > 0);
        return modulesActive || globalActive || courseActive;
    }, [payload]);

    const loadPayload = async() => {
        setLoading(true);
        setError(null);
        try {
            const res = await Fetch.performGet('local_ai_content', `sourcemanagement/${contextid}`);
            const data = await res.json() as SourceManagementResponse;
            setPayload(data);
        } catch {
            setError('Die Quellen konnten nicht geladen werden.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayload();
    }, [contextid]);

    useEffect(() => {
        let timer: number | null = null;
        if (hasActiveTasks) {
            timer = window.setInterval(() => {
                void loadPayload();
            }, 5000);
        }
        return () => {
            if (timer !== null) {
                window.clearInterval(timer);
            }
        };
    }, [hasActiveTasks]);

    const executeAction = async(actionPayload: SaveActionPayload) => {
        setSaving(true);
        setError(null);
        try {
            const res = await Fetch.request('local_ai_content', `sourcemanagement/${contextid}`, {
                method: 'POST',
                params: {sesskey: getSesskey()},
                body: {...actionPayload, sesskey: getSesskey()},
            });
            if (!res.ok) {
                setError(`Speichern fehlgeschlagen (HTTP ${res.status}).`);
                return null;
            }
            return res.json();
        } catch {
            setError('Die Aktion konnte nicht ausgeführt werden.');
            return null;
        } finally {
            setSaving(false);
        }
    };

    const executeAndRefresh = async(actionPayload: SaveActionPayload) => {
        const data = await executeAction(actionPayload) as SourceManagementResponse | null;
        if (data) {
            setPayload(data);
        }
    };

    const handleModuleEnabledToggle = async(row: ModuleSource, enabled: boolean) => {
        await executeAndRefresh({action: 'toggle_module_enabled', cmid: row.cmid, enabled});
    };

    const handleModuleAllowIndexToggle = async(row: ModuleSource, allowindex: boolean) => {
        await executeAndRefresh({action: 'toggle_module_allowindex', cmid: row.cmid, allowindex});
    };

    const openCreateModal = (scope: 'global' | 'course') => {
        setError(null);
        setCreateScope(scope);
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
        await executeAndRefresh({
            action: 'create_document',
            scope: createScope,
            name: newDocument.name,
            description: newDocument.description,
            content: newDocument.content,
        });
        setCreateScope(null);
    };

    const handleUpdateDocument = async() => {
        if (!editingDocument) {
            return;
        }
        await executeAndRefresh({
            action: 'update_document',
            sourceid: editingDocument.id,
            name: editingDocument.name,
            description: editingDocument.description,
            content: editingDocument.content,
        });
        setEditingDocument(null);
    };

    const handleDeleteDocument = async(sourceid: number) => {
        await executeAndRefresh({action: 'delete_source', sourceid});
    };

    const openImportModal = () => {
        setError(null);
        setImportModalOpen(true);
        setImportStep(1);
        setImportCourseId(0);
        setImportables([]);
        setSelectedImportKeys(new Set());
    };

    const closeImportModal = () => {
        setImportModalOpen(false);
        setImportStep(1);
    };

    const loadImportables = async() => {
        if (!importCourseId) {
            setError('Bitte zuerst einen Kurs auswählen.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await Fetch.performGet('local_ai_content', `sourcemanagement/${contextid}/importables/${importCourseId}`);
            const data = await res.json() as {importables?: ImportableSource[]};
            setImportables(data.importables ?? []);
            setSelectedImportKeys(new Set());
            setImportStep(2);
        } catch {
            setError('Die Aktivitäten und Dokumente konnten nicht geladen werden.');
        } finally {
            setSaving(false);
        }
    };

    const toggleImportKey = (key: string) => {
        setSelectedImportKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const submitImport = async() => {
        if (!importCourseId || selectedImportKeys.size === 0) {
            setError('Bitte mindestens eine Quelle zum Hinzufügen auswählen.');
            return;
        }
        await executeAndRefresh({
            action: 'import_sources',
            sourcecourseid: importCourseId,
            selectedimportkeys: [...selectedImportKeys],
        });
        closeImportModal();
    };

    const renderDocumentTable = (title: string, rows: DocumentSource[], canCreate: boolean, scope: 'global' | 'course') => (
        <section className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">{title}</h5>
                {canCreate && (
                    <Button
                        type="button"
                        variant="primary"
                        disabled={saving}
                        onClick={() => openCreateModal(scope)}
                        startIcon={plusIcon}
                        label="Dokument anlegen"
                    />
                )}
            </div>
            <table className="table table-sm table-striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Beschreibung</th>
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
                                <span className="badge badge-light">{row.indexstatuslabel}</span>
                                {row.progressrecordid > 0 && isActiveStatus(row.indexstatus) && (
                                    <StoredProgress
                                        percent={row.progresspercent}
                                        message={row.progressmessage}
                                        error={row.progresserror}
                                    />
                                )}
                            </td>
                            <td>{formatTimestamp(row.lastindexed)}</td>
                            <td>
                                {row.canedit && (
                                    <div className="d-flex gap-1">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={saving}
                                            onClick={() => setEditingDocument({
                                                id: row.id,
                                                name: row.name,
                                                description: row.description,
                                                content: row.content,
                                            })}
                                            label="Bearbeiten"
                                        />
                                        <Button
                                            type="button"
                                            variant="danger"
                                            disabled={saving}
                                            onClick={() => handleDeleteDocument(row.id)}
                                            label="Löschen"
                                        />
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-muted">Keine Dokumente vorhanden.</td>
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
            {renderDocumentTable(
                'Globale Dokumente (Systemkontext)',
                payload.globaldocuments,
                payload.canmanagesystemsources,
                'global',
            )}

            {renderDocumentTable('Dokumente dieses Kurses', payload.coursedocuments, true, 'course')}

            <section className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Dokumente aus anderen Kursen</h5>
                    <Button
                        type="button"
                        variant="primary"
                        disabled={saving}
                        onClick={openImportModal}
                        startIcon={plusIcon}
                        label="Hinzufügen"
                    />
                </div>
                <div className="small text-muted">
                    Quellen aus anderen Kursen werden nicht automatisch gelistet und müssen explizit hinzugefügt werden.
                </div>
            </section>

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
                                    {row.progressrecordid > 0 && isActiveStatus(row.indexstatus) && (
                                        <StoredProgress
                                            percent={row.progresspercent}
                                            message={row.progressmessage}
                                            error={row.progresserror}
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

            {importModalOpen && (
                <>
                    <div
                        className="modal fade show d-block"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="source-import-modal-title"
                    >
                        <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 id="source-import-modal-title" className="modal-title">
                                        Quellen aus anderen Kursen hinzufügen
                                    </h5>
                                    <button
                                        type="button"
                                        className="close"
                                        aria-label="Close"
                                        onClick={closeImportModal}
                                        disabled={saving}
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {importStep === 1 && (
                                        <div className="form-group mb-0">
                                            <label htmlFor="source-import-course-select">Kurs auswählen</label>
                                            <select
                                                id="source-import-course-select"
                                                className="custom-select"
                                                value={importCourseId}
                                                onChange={(e) => setImportCourseId(parseInt(e.target.value, 10) || 0)}
                                            >
                                                <option value={0}>Bitte Kurs wählen</option>
                                                {payload.importablecourses.map((course) => (
                                                    <option key={course.id} value={course.id}>
                                                        {course.name} ({course.shortname})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {importStep === 2 && (
                                        <>
                                            <div className="small text-muted mb-2">
                                                Verfügbare Dokumente und Aktivitäten im gewählten Kurs:
                                            </div>
                                            <div className="border rounded p-2" style={{maxHeight: '320px', overflowY: 'auto'}}>
                                                {importables.length === 0 && (
                                                    <div className="small text-muted">Keine importierbaren Quellen gefunden.</div>
                                                )}
                                                {importables.map((item) => (
                                                    <div key={item.key} className="form-check mb-1">
                                                        <input
                                                            id={`importable-${item.key}`}
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={selectedImportKeys.has(item.key)}
                                                            onChange={() => toggleImportKey(item.key)}
                                                        />
                                                        <label htmlFor={`importable-${item.key}`} className="form-check-label">
                                                            {item.name}
                                                            {item.meta ? ` (${item.meta})` : ''}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    {importStep === 2 && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={saving}
                                            onClick={() => setImportStep(1)}
                                            label="Zurück"
                                        />
                                    )}
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={saving}
                                        onClick={closeImportModal}
                                        label="Abbrechen"
                                    />
                                    {importStep === 1 && (
                                        <Button
                                            type="button"
                                            variant="primary"
                                            disabled={saving || !importCourseId}
                                            onClick={loadImportables}
                                            label="Weiter"
                                        />
                                    )}
                                    {importStep === 2 && (
                                        <Button
                                            type="button"
                                            variant="primary"
                                            disabled={saving || selectedImportKeys.size === 0}
                                            onClick={submitImport}
                                            label="Auswahl hinzufügen"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeImportModal} />
                </>
            )}

            {editingDocument && (
                <div className="border rounded p-3 mb-3">
                    <h6 className="mb-2">Dokument bearbeiten</h6>
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
                    <div className="form-group">
                        <label>Inhalt</label>
                        <textarea
                            className="form-control form-control-sm"
                            rows={5}
                            value={editingDocument.content}
                            onChange={(e) => setEditingDocument({...editingDocument, content: e.target.value})}
                        />
                    </div>
                    <div className="d-flex gap-2">
                        <Button
                            type="button"
                            variant="primary"
                            disabled={saving}
                            onClick={handleUpdateDocument}
                            label="Speichern"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={saving}
                            onClick={() => setEditingDocument(null)}
                            label="Abbrechen"
                        />
                    </div>
                </div>
            )}

            {error && <div className="text-danger small mt-2">{error}</div>}
        </div>
    );
}


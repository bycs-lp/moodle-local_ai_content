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
 * React component for selecting sources for a given context.
 *
 * @module     local_ai_content/source_selector
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {useState, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import Fetch from '@moodle/lms/core/fetch';
// @ts-ignore - path resolved via Moodle import map at runtime
import {Checkbox} from '@moodlehq/design-system';
import {
    closeSourceSelectorModal,
    openSourceSelectorModal,
    type MoodleModal,
} from './source_selector/source_selection_modal_manager';

/** A single selectable source returned by the API. */
type SourceOption = {
    id: number;
    cmid: number;
    name: string;
    sourcetype?: string;
};

/** Shape of the GET /contexts/{contextId}/source-selections response. */
type ContextSourceSelectionResponse = {
    items?: Array<{
        globalDocuments?: SourceOption[];
        courseActivities?: SourceOption[];
        externalSources?: SourceOption[];
        selectedSourceIds?: string;
    }>;
};

type ImportableCourse = {
    id: number;
    name: string;
    shortname: string;
};

type ImportableCoursesResponse = {
    items?: ImportableCourse[];
};

type ImportableSourcesResponse = {
    items?: Array<{
        courseActivities?: SourceOption[];
        courseDocuments?: SourceOption[];
    }>;
};

type SourceListSectionProps = {
    contextId: number;
    sources: SourceOption[];
    sectionTitle: string;
    emptyText: string;
    selected: Set<number>;
    saving: boolean;
    onToggle: (id: number) => void;
    onRemove?: (id: number) => void;
};

type ImportListSectionProps = {
    contextId: number;
    sources: SourceOption[];
    sectionTitle: string;
    emptyText: string;
    stagedSelection: Set<number>;
    onToggle: (id: number) => void;
};

/** Component props passed from the Mustache template via data-react-props. */
type Props = {
    /** The Moodle context ID for which source selection is managed. */
    contextId: number;
    /** Button tooltip and aria label. */
    buttonTitle?: string;
    /** Modal title string. */
    modalTitle?: string;
};

type SourceSelectorApi = {
    getSelectedSourceIds: (contextId: number) => number[];
    setSelectedSourceIds: (contextId: number, sourceIds: number[]) => void;
    subscribe: (contextId: number, callback: (sourceIds: number[]) => void) => () => void;
    unsubscribe: (contextId: number, callback: (sourceIds: number[]) => void) => void;
};

const SOURCE_SELECTOR_API_KEY = 'localAiContentSourceSelectorApi';

/**
 * Get the global source selector API instance.
 *
 * @returns {?SourceSelectorApi} API instance or null when unavailable.
 */
function getSourceSelectorApi(): SourceSelectorApi | null {
    const scope = window as unknown as {[key: string]: unknown};
    const existing = scope[SOURCE_SELECTOR_API_KEY] as SourceSelectorApi | undefined;
    if (
        existing
        && typeof existing.setSelectedSourceIds === 'function'
        && typeof existing.getSelectedSourceIds === 'function'
        && typeof existing.subscribe === 'function'
        && typeof existing.unsubscribe === 'function'
    ) {
        return existing;
    }
    return null;
}

/**
 * Publish the current selection for optional external readers.
 *
 * @param {number} contextId The Moodle context ID.
 * @param {string} selectedSourceIds Comma-separated selected source IDs.
 */
function publishSelected(contextId: number, selectedSourceIds: string): void {
    const sourceSelectorApi = getSourceSelectorApi();
    if (!sourceSelectorApi) {
        return;
    }
    sourceSelectorApi.setSelectedSourceIds(contextId, Array.from(parseIds(selectedSourceIds)));
}
/**
 * Parse a comma-separated string of integers into a Set<number>.
 *
 * @param {string} raw Comma-separated list of integer strings.
 * @returns {Set<number>} Set of parsed IDs.
 */
function parseIds(raw: string): Set<number> {
    if (!raw) {
        return new Set();
    }
    return new Set(
        raw.split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n) && n > 0),
    );
}

/**
 * Build one compact meta string for a source.
 *
 * @param {SourceOption} source Source item.
 * @returns {string} Origin/type label.
 */
function getSourceMeta(source: SourceOption): string {
    return source.sourcetype ?? '';
}

/**
 * Render one selectable source section.
 *
 * @param {SourceListSectionProps} props Section props.
 * @returns {JSX.Element} Section UI.
 */
function SourceListSection({
    contextId,
    sources,
    sectionTitle,
    emptyText,
    selected,
    saving,
    onToggle,
    onRemove,
}: SourceListSectionProps) {
    return (
        <section className="mb-3">
            <h6 className="mb-2">{sectionTitle}</h6>
            {sources.length === 0 && <div className="text-muted small">{emptyText}</div>}
            {sources.length > 0 && (
                <ul className="source-selector__list list-unstyled mb-0">
                    {sources.map((source) => (
                        <li key={source.id} className="source-selector__item mb-1">
                            <div className="d-flex justify-content-between align-items-start gap-2">
                                <div className="flex-grow-1">
                                    <Checkbox
                                        id={`source-selector-source-${contextId}-${source.id}`}
                                        checked={selected.has(source.id)}
                                        onChange={() => onToggle(source.id)}
                                        label={source.name}
                                        supportingText={getSourceMeta(source)}
                                    />
                                </div>
                                {onRemove && (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0 text-muted"
                                        title="Quelle entfernen"
                                        aria-label={`Quelle ${source.name} entfernen`}
                                        onClick={() => onRemove(source.id)}
                                        disabled={saving}
                                    >
                                        <i className="icon fa fa-unlink" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

/**
 * Render one import selection section.
 *
 * @param {ImportListSectionProps} props Section props.
 * @returns {JSX.Element} Section UI.
 */
function ImportListSection({
    contextId,
    sources,
    sectionTitle,
    emptyText,
    stagedSelection,
    onToggle,
}: ImportListSectionProps) {
    return (
        <section className="mb-3">
            <h6 className="mb-2">{sectionTitle}</h6>
            {sources.length === 0 && <div className="text-muted small">{emptyText}</div>}
            {sources.length > 0 && (
                <ul className="source-selector__list list-unstyled mb-0">
                    {sources.map((source) => (
                        <li key={source.id} className="source-selector__item mb-1">
                            <Checkbox
                                id={`source-selector-import-source-${contextId}-${source.id}`}
                                checked={stagedSelection.has(source.id)}
                                onChange={() => onToggle(source.id)}
                                label={source.name}
                                supportingText={getSourceMeta(source)}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

/**
 * Context source selector component.
 *
 * Renders a checkbox list of selectable sources for the given contextId and saves
 * the source selection via the REST API.
 *
 * @param {Props} props Component props.
 * @returns {JSX.Element} The rendered component.
 */
export default function SourceSelector({
    contextId,
    buttonTitle = 'Kontextquellen auswählen',
    modalTitle = 'Kontextquellen auswählen',
}: Props) {
    const [globalDocuments, setGlobalDocuments] = useState<SourceOption[]>([]);
    const [courseActivities, setCourseActivities] = useState<SourceOption[]>([]);
    const [externalSources, setExternalSources] = useState<SourceOption[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const [mode, setMode] = useState<'main' | 'courses' | 'sources'>('main');
    const [importableCourses, setImportableCourses] = useState<ImportableCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
    const [importCourseActivities, setImportCourseActivities] = useState<SourceOption[]>([]);
    const [importCourseDocuments, setImportCourseDocuments] = useState<SourceOption[]>([]);
    const [stagedImportSelection, setStagedImportSelection] = useState<Set<number>>(new Set());

    const [loading, setLoading] = useState<boolean>(true);
    const [loadingImportView, setLoadingImportView] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalBodyRoot, setModalBodyRoot] = useState<HTMLElement | null>(null);
    const modalRef = useRef<MoodleModal | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        Fetch.performGet('local_ai_content', `contexts/${contextId}/source-selections`)
            .then((res: Response) => res.json() as Promise<ContextSourceSelectionResponse>)
            .then((data: ContextSourceSelectionResponse) => {
                const item = data.items?.[0] ?? {};
                setGlobalDocuments(item.globalDocuments ?? []);
                setCourseActivities(item.courseActivities ?? []);
                setExternalSources(item.externalSources ?? []);
                const selectedSourceIds = item.selectedSourceIds ?? '';
                setSelected(parseIds(selectedSourceIds));
                publishSelected(contextId, selectedSourceIds);
                setLoading(false);
                return data;
            })
            .catch(() => {
                setError('Failed to load source selection for this context.');
                setLoading(false);
            });
    }, [contextId]);

    const handleToggle = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
        setSaveSuccess(false);
    };

    const handleImportToggle = (id: number) => {
        setStagedImportSelection((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleRemoveExternalSource = (id: number) => {
        setExternalSources((prev) => prev.filter((source) => source.id !== id));
        setSelected((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        setSaveSuccess(false);
    };

    const loadImportableCourses = async() => {
        setLoadingImportView(true);
        setError(null);
        try {
            const res = await Fetch.performGet('local_ai_content', `contexts/${contextId}/source-selections/importable-courses`);
            const data = await res.json() as ImportableCoursesResponse;
            const courses = data.items ?? [];
            setImportableCourses(courses);
            setSelectedCourseId(courses[0]?.id ?? 0);
        } catch {
            setError('Die auswählbaren Kurse konnten nicht geladen werden.');
        } finally {
            setLoadingImportView(false);
        }
    };

    const openCourseSelection = async() => {
        setMode('courses');
        setImportCourseActivities([]);
        setImportCourseDocuments([]);
        setStagedImportSelection(new Set());
        await loadImportableCourses();
    };

    const loadImportableSources = async() => {
        if (selectedCourseId <= 0) {
            return;
        }
        setLoadingImportView(true);
        setError(null);
        try {
            const res = await Fetch.performGet(
                'local_ai_content',
                `contexts/${contextId}/source-selections/importable-sources?sourceCourseId=${selectedCourseId}`,
            );
            const data = await res.json() as ImportableSourcesResponse;
            const item = data.items?.[0] ?? {};
            const existingExternalIds = new Set(externalSources.map((source) => source.id));
            const activities = (item.courseActivities ?? []).filter((source) => !existingExternalIds.has(source.id));
            const documents = (item.courseDocuments ?? []).filter((source) => !existingExternalIds.has(source.id));
            const nextStaged = new Set<number>();
            [...activities, ...documents].forEach((source) => {
                if (selected.has(source.id)) {
                    nextStaged.add(source.id);
                }
            });
            setImportCourseActivities(activities);
            setImportCourseDocuments(documents);
            setStagedImportSelection(nextStaged);
            setMode('sources');
        } catch {
            setError('Die Quellen des ausgewählten Kurses konnten nicht geladen werden.');
        } finally {
            setLoadingImportView(false);
        }
    };

    const addSelectedExternalSources = () => {
        const importableSources = [...importCourseActivities, ...importCourseDocuments];
        const byId = new Map<number, SourceOption>();
        importableSources.forEach((source) => byId.set(source.id, source));

        setSelected((prev) => {
            const next = new Set(prev);
            stagedImportSelection.forEach((id) => next.add(id));
            return next;
        });

        setExternalSources((prev) => {
            const existingIds = new Set(prev.map((source) => source.id));
            const localIds = new Set([...globalDocuments, ...courseActivities].map((source) => source.id));
            const next = [...prev];
            stagedImportSelection.forEach((id) => {
                if (existingIds.has(id) || localIds.has(id)) {
                    return;
                }
                const source = byId.get(id);
                if (!source) {
                    return;
                }
                next.push(source);
            });
            return next.sort((a, b) => a.name.localeCompare(b.name));
        });

        setMode('main');
        setSaveSuccess(false);
    };

    const handleSave = async() => {
        setSaving(true);
        setSaveSuccess(false);
        setError(null);

        const selectedSourceIds = [...selected].join(',');
        publishSelected(contextId, selectedSourceIds);

        const response = await Fetch.request('local_ai_content', `contexts/${contextId}/source-selections`, {
            method: 'PUT',
            body: {
                selectedSourceIds,
            },
        });

        if (!response.ok) {
            setError(`Failed to save source selection for this context (HTTP ${response.status}).`);
            setSaving(false);
            return;
        }

        setSaveSuccess(true);
        setSaving(false);
    };

    useEffect(() => {
        publishSelected(contextId, [...selected].join(','));
    }, [contextId, selected]);

    useEffect(() => {
        return () => {
            if (modalRef.current) {
                closeSourceSelectorModal(modalRef.current);
                modalRef.current = null;
            }
        };
    }, []);

    const openModal = async() => {
        if (modalRef.current) {
            return;
        }

        try {
            const modalResult = await openSourceSelectorModal({
                title: modalTitle,
                onShown: () => {
                    setIsModalOpen(true);
                },
                onHidden: () => {
                    setIsModalOpen(false);
                    setModalBodyRoot(null);
                    modalRef.current = null;
                },
            });
            if (!modalResult) {
                return;
            }

            modalRef.current = modalResult.modal;
            setModalBodyRoot(modalResult.bodyRoot);
        } catch {
            // Reset modal state so users can retry opening on transient loader errors.
            setIsModalOpen(false);
            setModalBodyRoot(null);
            modalRef.current = null;
        }
    };

    const renderCoursesContent = () => (
        <div className="source-selector">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Fremdkurs auswählen</h6>
                <button
                    type="button"
                    className="btn btn-link btn-sm p-0"
                    onClick={() => setMode('main')}
                    disabled={loadingImportView || saving}
                >
                    Zurück
                </button>
            </div>

            {loadingImportView && <div className="text-muted small mb-2">Lade Kurse...</div>}
            {!loadingImportView && importableCourses.length === 0 && (
                <div className="text-muted small mb-2">Keine weiteren Kurse mit nutzbaren Quellen gefunden.</div>
            )}
            {!loadingImportView && importableCourses.length > 0 && (
                <>
                    <div className="form-group">
                        <label htmlFor={`source-selector-import-course-${contextId}`}>Kurs</label>
                        <select
                            id={`source-selector-import-course-${contextId}`}
                            className="custom-select"
                            value={selectedCourseId}
                            onChange={(event) => setSelectedCourseId(parseInt(event.target.value, 10) || 0)}
                            disabled={saving}
                        >
                            {importableCourses.map((course) => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={loadImportableSources}
                        disabled={selectedCourseId <= 0 || saving || loadingImportView}
                    >
                        Quellen laden
                    </button>
                </>
            )}

            {error && <div className="text-danger small mt-2">{error}</div>}
        </div>
    );

    const renderImportSourcesContent = () => (
        <div className="source-selector source-selector--empty">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Quellen aus Fremdkurs hinzufügen</h6>
                <button
                    type="button"
                    className="btn btn-link btn-sm p-0"
                    onClick={() => setMode('courses')}
                    disabled={loadingImportView || saving}
                >
                    Kurs wechseln
                </button>
            </div>

            {loadingImportView && <div className="text-muted small">Lade Quellen...</div>}
            {!loadingImportView && (
                <>
                    <ImportListSection
                        contextId={contextId}
                        sources={importCourseDocuments}
                        sectionTitle="Kursdokumente"
                        emptyText="Keine Kursdokumente verfügbar."
                        stagedSelection={stagedImportSelection}
                        onToggle={handleImportToggle}
                    />
                    <ImportListSection
                        contextId={contextId}
                        sources={importCourseActivities}
                        sectionTitle="Kursaktivitäten"
                        emptyText="Keine Kursaktivitäten verfügbar."
                        stagedSelection={stagedImportSelection}
                        onToggle={handleImportToggle}
                    />

                    <div className="d-flex gap-2 mt-3">
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setMode('main')}
                            disabled={saving}
                        >
                            Abbrechen
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={addSelectedExternalSources}
                            disabled={saving || stagedImportSelection.size === 0}
                        >
                            Hinzufügen
                        </button>
                    </div>
                </>
            )}

            {error && <div className="text-danger small mt-2">{error}</div>}
        </div>
    );

    const renderMainContent = () => (
        <div className="source-selector">
            <SourceListSection
                contextId={contextId}
                sources={globalDocuments}
                sectionTitle="Globale Dokumente"
                emptyText="Keine globalen Dokumente verfügbar."
                selected={selected}
                saving={saving}
                onToggle={handleToggle}
            />
            <SourceListSection
                contextId={contextId}
                sources={courseActivities}
                sectionTitle="Kursaktivitäten"
                emptyText="Keine Kursaktivitäten verfügbar."
                selected={selected}
                saving={saving}
                onToggle={handleToggle}
            />
            <SourceListSection
                contextId={contextId}
                sources={externalSources}
                sectionTitle="Externe Quellen"
                emptyText="Keine externen Quellen hinzugefügt."
                selected={selected}
                saving={saving}
                onToggle={handleToggle}
                onRemove={handleRemoveExternalSource}
            />

            <div className="mb-3">
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={openCourseSelection}
                    disabled={saving || loadingImportView}
                >
                    <i className="icon fa fa-plus mr-1" aria-hidden="true" />
                    Quelle hinzufügen
                </button>
            </div>

            <div className="source-selector__actions mt-2 d-flex align-items-center gap-3">
                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={saving}
                >
                    Speichern
                </button>
                {saving && (
                    <span className="text-muted small">Speichere...</span>
                )}

                {saveSuccess && (
                    <span className="text-success small">Gespeichert</span>
                )}

                {error && (
                    <span className="text-danger small">{error}</span>
                )}
            </div>
        </div>
    );

    const renderSelectorContent = () => {
        if (loading) {
            return <div className="source-selector source-selector--loading">Lade Quellen...</div>;
        }

        if (mode === 'courses') {
            return renderCoursesContent();
        }

        if (mode === 'sources') {
            return renderImportSourcesContent();
        }

        return renderMainContent();
    };

    return (
        <>
            <button
                type="button"
                className="btn btn-icon icon-no-margin p-0"
                title={buttonTitle}
                aria-label={buttonTitle}
                onClick={openModal}
            >
                <i className="fa fa-paperclip" aria-hidden="true" />
            </button>

            {isModalOpen && modalBodyRoot && createPortal(renderSelectorContent(), modalBodyRoot)}
        </>
    );
}

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

import {useState, useEffect} from 'react';
import Fetch from '@moodle/lms/core/fetch';
// @ts-ignore - path resolved via Moodle import map at runtime
import {Checkbox} from '@moodlehq/design-system';

/** A single selectable source returned by the API. */
type SourceOption = {
    id: number;
    cmid: number;
    name: string;
    sourcetype?: string;
    origin?: string;
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
    contextid: number;
    sources: SourceOption[];
    sectiontitle: string;
    emptytext: string;
    selected: Set<number>;
    saving: boolean;
    onToggle: (id: number) => void;
    onRemove?: (id: number) => void;
};

type ImportListSectionProps = {
    contextid: number;
    sources: SourceOption[];
    sectiontitle: string;
    emptytext: string;
    stagedselection: Set<number>;
    onToggle: (id: number) => void;
};

/** Component props passed from the Mustache template via data-react-props. */
type Props = {
    /** The Moodle context ID for which source selection is managed. */
    contextid: number;
};

type SourceSelectionBridge = {
    getSelected: (contextid: number) => string;
    getRequestData: (contextid: number) => {selectedSourceIds: string};
    saveSelection: (contextid: number) => Promise<boolean>;
};

const BRIDGE_KEY = 'localAiContentSourceSelection';
const selectioncache = new Map<number, string>();
const savehandlercache: Map<number, () => Promise<boolean>> = new Map();

/**
 * Ensure the global bridge object exists and return it.
 *
 * External usage example:
 *   const api = (window as unknown as {[key: string]: unknown})['localAiContentSourceSelection'] as SourceSelectionBridge;
 *   const requestdata = api.getRequestData(contextid);
 *
 * @returns {SourceSelectionBridge} The global bridge.
 */
function getSourceSelectionBridge(): SourceSelectionBridge {
    const scope = window as unknown as {[key: string]: unknown};
    const existing = scope[BRIDGE_KEY] as SourceSelectionBridge | undefined;
    if (
        existing
        && typeof existing.getSelected === 'function'
        && typeof existing.getRequestData === 'function'
        && typeof existing.saveSelection === 'function'
    ) {
        return existing;
    }

    const bridge: SourceSelectionBridge = {
        getSelected(contextid: number): string {
            return selectioncache.get(contextid) ?? '';
        },
        getRequestData(contextid: number): {selectedSourceIds: string} {
            return {selectedSourceIds: selectioncache.get(contextid) ?? ''};
        },
        async saveSelection(contextid: number): Promise<boolean> {
            const handler = savehandlercache.get(contextid);
            if (!handler) {
                return false;
            }
            return handler();
        },
    };
    scope[BRIDGE_KEY] = bridge;
    return bridge;
}

/**
 * Publish the current selection for optional external readers.
 *
 * @param {number} contextid The Moodle context ID.
 * @param {string} selectedsourceids Comma-separated selected source IDs.
 */
function publishSelected(contextid: number, selectedsourceids: string): void {
    selectioncache.set(contextid, selectedsourceids);
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
    if (source.origin && source.sourcetype) {
        return `${source.origin} · ${source.sourcetype}`;
    }
    if (source.origin) {
        return source.origin;
    }
    return source.sourcetype ?? '';
}

/**
 * Render one selectable source section.
 *
 * @param {SourceListSectionProps} props Section props.
 * @returns {JSX.Element} Section UI.
 */
function SourceListSection({
    contextid,
    sources,
    sectiontitle,
    emptytext,
    selected,
    saving,
    onToggle,
    onRemove,
}: SourceListSectionProps) {
    return (
        <section className="mb-3">
            <h6 className="mb-2">{sectiontitle}</h6>
            {sources.length === 0 && <div className="text-muted small">{emptytext}</div>}
            {sources.length > 0 && (
                <ul className="source-selector__list list-unstyled mb-0">
                    {sources.map((source) => (
                        <li key={source.id} className="source-selector__item mb-1">
                            <div className="d-flex justify-content-between align-items-start gap-2">
                                <div className="flex-grow-1">
                                    <Checkbox
                                        id={`source-selector-source-${contextid}-${source.id}`}
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
    contextid,
    sources,
    sectiontitle,
    emptytext,
    stagedselection,
    onToggle,
}: ImportListSectionProps) {
    return (
        <section className="mb-3">
            <h6 className="mb-2">{sectiontitle}</h6>
            {sources.length === 0 && <div className="text-muted small">{emptytext}</div>}
            {sources.length > 0 && (
                <ul className="source-selector__list list-unstyled mb-0">
                    {sources.map((source) => (
                        <li key={source.id} className="source-selector__item mb-1">
                            <Checkbox
                                id={`source-selector-import-source-${contextid}-${source.id}`}
                                checked={stagedselection.has(source.id)}
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
 * Renders a checkbox list of selectable sources for the given contextid and saves
 * the source selection via the REST API.
 *
 * @param {Props} props Component props.
 * @returns {JSX.Element} The rendered component.
 */
export default function SourceSelector({contextid}: Props) {
    const [globaldocuments, setGlobaldocuments] = useState<SourceOption[]>([]);
    const [courseactivities, setCourseactivities] = useState<SourceOption[]>([]);
    const [externalsources, setExternalsources] = useState<SourceOption[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const [mode, setMode] = useState<'main' | 'courses' | 'sources'>('main');
    const [importablecourses, setImportablecourses] = useState<ImportableCourse[]>([]);
    const [selectedcourseid, setSelectedcourseid] = useState<number>(0);
    const [importcourseactivities, setImportcourseactivities] = useState<SourceOption[]>([]);
    const [importcoursedocuments, setImportcoursedocuments] = useState<SourceOption[]>([]);
    const [stagedimportselection, setStagedimportselection] = useState<Set<number>>(new Set());

    const [loading, setLoading] = useState<boolean>(true);
    const [loadingimportview, setLoadingimportview] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const bridge = getSourceSelectionBridge();

    useEffect(() => {
        setLoading(true);
        setError(null);

        Fetch.performGet('local_ai_content', `contexts/${contextid}/source-selections`)
            .then((res: Response) => res.json() as Promise<ContextSourceSelectionResponse>)
            .then((data: ContextSourceSelectionResponse) => {
                const item = data.items?.[0] ?? {};
                setGlobaldocuments(item.globalDocuments ?? []);
                setCourseactivities(item.courseActivities ?? []);
                setExternalsources(item.externalSources ?? []);
                const selectedsourceids = item.selectedSourceIds ?? '';
                setSelected(parseIds(selectedsourceids));
                publishSelected(contextid, selectedsourceids);
                setLoading(false);
                return data;
            })
            .catch(() => {
                setError('Failed to load source selection for this context.');
                setLoading(false);
            });
    }, [contextid]);

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
        setStagedimportselection((prev) => {
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
        setExternalsources((prev) => prev.filter((source) => source.id !== id));
        setSelected((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        setSaveSuccess(false);
    };

    const loadImportableCourses = async() => {
        setLoadingimportview(true);
        setError(null);
        try {
            const res = await Fetch.performGet('local_ai_content', `contexts/${contextid}/source-selections/importable-courses`);
            const data = await res.json() as ImportableCoursesResponse;
            const courses = data.items ?? [];
            setImportablecourses(courses);
            setSelectedcourseid(courses[0]?.id ?? 0);
        } catch {
            setError('Die auswählbaren Kurse konnten nicht geladen werden.');
        } finally {
            setLoadingimportview(false);
        }
    };

    const openCourseSelection = async() => {
        setMode('courses');
        setImportcourseactivities([]);
        setImportcoursedocuments([]);
        setStagedimportselection(new Set());
        await loadImportableCourses();
    };

    const loadImportableSources = async() => {
        if (selectedcourseid <= 0) {
            return;
        }
        setLoadingimportview(true);
        setError(null);
        try {
            const res = await Fetch.performGet(
                'local_ai_content',
                `contexts/${contextid}/source-selections/importable-sources?sourceCourseId=${selectedcourseid}`,
            );
            const data = await res.json() as ImportableSourcesResponse;
            const item = data.items?.[0] ?? {};
            const existingexternalids = new Set(externalsources.map((source) => source.id));
            const activities = (item.courseActivities ?? []).filter((source) => !existingexternalids.has(source.id));
            const documents = (item.courseDocuments ?? []).filter((source) => !existingexternalids.has(source.id));
            const nextstaged = new Set<number>();
            [...activities, ...documents].forEach((source) => {
                if (selected.has(source.id)) {
                    nextstaged.add(source.id);
                }
            });
            setImportcourseactivities(activities);
            setImportcoursedocuments(documents);
            setStagedimportselection(nextstaged);
            setMode('sources');
        } catch {
            setError('Die Quellen des ausgewählten Kurses konnten nicht geladen werden.');
        } finally {
            setLoadingimportview(false);
        }
    };

    const addSelectedExternalSources = () => {
        const importablesources = [...importcourseactivities, ...importcoursedocuments];
        const byid = new Map<number, SourceOption>();
        importablesources.forEach((source) => byid.set(source.id, source));

        setSelected((prev) => {
            const next = new Set(prev);
            stagedimportselection.forEach((id) => next.add(id));
            return next;
        });

        setExternalsources((prev) => {
            const existingids = new Set(prev.map((source) => source.id));
            const localids = new Set([...globaldocuments, ...courseactivities].map((source) => source.id));
            const next = [...prev];
            stagedimportselection.forEach((id) => {
                if (existingids.has(id) || localids.has(id)) {
                    return;
                }
                const source = byid.get(id);
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

    const handleSave = async(): Promise<boolean> => {
        setSaving(true);
        setSaveSuccess(false);
        setError(null);

        publishSelected(contextid, [...selected].join(','));
        const requestdata = bridge.getRequestData(contextid);

        const res = await Fetch.request('local_ai_content', `contexts/${contextid}/source-selections`, {
            method: 'PATCH',
            body: requestdata,
        });

        if (!res.ok) {
            setError(`Failed to save source selection for this context (HTTP ${res.status}).`);
            setSaving(false);
            return false;
        } else {
            setSaveSuccess(true);
        }

        setSaving(false);
        return true;
    };

    useEffect(() => {
        publishSelected(contextid, [...selected].join(','));
    }, [contextid, selected]);

    useEffect(() => {
        savehandlercache.set(contextid, handleSave);
        return () => {
            savehandlercache.delete(contextid);
        };
    }, [contextid, selected]);

    if (loading) {
        return <div className="source-selector source-selector--loading">Lade Quellen...</div>;
    }

    if (mode === 'courses') {
        return (
            <div className="source-selector">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Fremdkurs auswählen</h6>
                    <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() => setMode('main')}
                        disabled={loadingimportview || saving}
                    >
                        Zurück
                    </button>
                </div>

                {loadingimportview && <div className="text-muted small mb-2">Lade Kurse...</div>}
                {!loadingimportview && importablecourses.length === 0 && (
                    <div className="text-muted small mb-2">Keine weiteren Kurse mit nutzbaren Quellen gefunden.</div>
                )}
                {!loadingimportview && importablecourses.length > 0 && (
                    <>
                        <div className="form-group">
                            <label htmlFor={`source-selector-import-course-${contextid}`}>Kurs</label>
                            <select
                                id={`source-selector-import-course-${contextid}`}
                                className="custom-select"
                                value={selectedcourseid}
                                onChange={(event) => setSelectedcourseid(parseInt(event.target.value, 10) || 0)}
                                disabled={saving}
                            >
                                {importablecourses.map((course) => (
                                    <option key={course.id} value={course.id}>{course.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={loadImportableSources}
                            disabled={selectedcourseid <= 0 || saving || loadingimportview}
                        >
                            Quellen laden
                        </button>
                    </>
                )}

                {error && <div className="text-danger small mt-2">{error}</div>}
            </div>
        );
    }

    if (mode === 'sources') {
        return (
            <div className="source-selector source-selector--empty">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Quellen aus Fremdkurs hinzufügen</h6>
                    <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() => setMode('courses')}
                        disabled={loadingimportview || saving}
                    >
                        Kurs wechseln
                    </button>
                </div>

                {loadingimportview && <div className="text-muted small">Lade Quellen...</div>}
                {!loadingimportview && (
                    <>
                        <ImportListSection
                            contextid={contextid}
                            sources={importcoursedocuments}
                            sectiontitle="Kursdokumente"
                            emptytext="Keine Kursdokumente verfügbar."
                            stagedselection={stagedimportselection}
                            onToggle={handleImportToggle}
                        />
                        <ImportListSection
                            contextid={contextid}
                            sources={importcourseactivities}
                            sectiontitle="Kursaktivitäten"
                            emptytext="Keine Kursaktivitäten verfügbar."
                            stagedselection={stagedimportselection}
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
                                disabled={saving || stagedimportselection.size === 0}
                            >
                                Hinzufügen
                            </button>
                        </div>
                    </>
                )}

                {error && <div className="text-danger small mt-2">{error}</div>}
            </div>
        );
    }

    return (
        <div className="source-selector">
            <SourceListSection
                contextid={contextid}
                sources={globaldocuments}
                sectiontitle="Globale Dokumente"
                emptytext="Keine globalen Dokumente verfügbar."
                selected={selected}
                saving={saving}
                onToggle={handleToggle}
            />
            <SourceListSection
                contextid={contextid}
                sources={courseactivities}
                sectiontitle="Kursaktivitäten"
                emptytext="Keine Kursaktivitäten verfügbar."
                selected={selected}
                saving={saving}
                onToggle={handleToggle}
            />
            <SourceListSection
                contextid={contextid}
                sources={externalsources}
                sectiontitle="Externe Quellen"
                emptytext="Keine externen Quellen hinzugefügt."
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
                    disabled={saving || loadingimportview}
                >
                    <i className="icon fa fa-plus mr-1" aria-hidden="true" />
                    Quelle hinzufügen
                </button>
            </div>

            <div className="source-selector__actions mt-2 d-flex align-items-center gap-3">
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
}

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
 * Every source is selected with a checkbox; for a selected source a switch decides whether the AI reads its complete
 * content ("full") or looks up the passages relevant for a question ("search").
 *
 * @module     local_ai_content/source_selector
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {
    Fragment,
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
    type ButtonProps,
} from '@moodlehq/design-system';
import {closeModal, openModal, type MoodleModal} from './modal';
import {
    loadSourceSelection,
    saveSelectedSourceIds,
    type CourseSection,
    type SelectionMode,
    type SourceOption,
} from './source_selector/data_manager';
import {SectionToggle, SelectedCount, SourceLabel} from './source_ui';
import {COMPONENT, pluginString, StringsProvider} from './strings';
import Fetch from '@moodle/lms/core/fetch';
import MoodleString from '@moodle/lms/core/String';
import {getString, type StringParams} from '@moodle/lms/core/stringUtils';

/** Approximate number of characters of one page, used to show the size of a source. */
const PAGE_CHARS = 3000;

/** The selection modes in display order. */
const MODES: SelectionMode[] = ['full', 'search'];

/** Icons of the selection modes. */
const MODE_ICONS: Record<SelectionMode, string> = {
    full: 'fa-file-lines',
    search: 'fa-magnifying-glass',
};

/** The selected sources with their selection mode. */
type Selection = Map<number, SelectionMode>;

type ImportableCourse = {
    id: number;
    name: string;
    shortName: string;
};

type ImportableCoursesResponse = {
    items: ImportableCourse[];
};

type ImportableSourcesResponse = {
    items: Array<{
        courseActivities: SourceOption[];
        courseDocuments: SourceOption[];
    }>;
};

/** Props shared by the components rendering source rows. */
type RowContext = {
    /** Prefix of the element ids, unique per selector instance and list. */
    idPrefix: string;
    selection: Selection;
    /** Whether the selection is shown read-only. */
    readOnly: boolean;
    /** Characters of a complete content above which a warning is shown, 0 for no warning. */
    warnChars: number;
    onToggle: (source: SourceOption) => void;
    onModeChange?: (source: SourceOption, mode: SelectionMode) => void;
    onRemove?: (source: SourceOption) => void;
    onToggleAll: (sources: SourceOption[]) => void;
};

/** Component props passed from the Mustache template via data-react-props. */
type Props = {
    /** The Moodle context ID for which source selection is managed. */
    contextId: number;
    /** How a newly selected source is used, if the source supports it. */
    defaultMode?: SelectionMode;
};

/**
 * Render a design system button labelled with a language string.
 *
 * @param props The string identifier, its component and the button props.
 * @returns Button UI.
 */
function StringButton({identifier, component = COMPONENT, ...props}: Omit<ButtonProps, 'label'> & {
    identifier: string;
    component?: string;
}) {
    return <Button {...props} label={use(getString(identifier, component))} />;
}

/**
 * Return the mode a source is selected with, preferring the given one.
 *
 * @param source The source to choose the mode for.
 * @param preferred The mode to use if the source supports it.
 * @returns The preferred mode if the source supports it, otherwise the first supported mode.
 */
const chooseMode = (source: SourceOption, preferred: SelectionMode): SelectionMode =>
    source.modes.includes(preferred) ? preferred : source.modes[0];

/**
 * Return the string describing the size of a content.
 *
 * @param length The number of characters, null if unknown.
 * @returns The string identifier and its parameter.
 */
const getSizeString = (length: number | null): [string, StringParams | undefined] => {
    if (length === null) {
        return ['selector_size_unknown', undefined];
    }

    if (length < PAGE_CHARS) {
        return ['selector_size_lessthanpage', undefined];
    }

    const pages = Math.round(length / PAGE_CHARS);
    return pages <= 1 ? ['selector_size_page', undefined] : ['selector_size_pages', pages];
};

/**
 * Render the badge marking a source whose content changed since it was indexed.
 *
 * @returns Badge UI.
 */
function OutdatedBadge() {
    return (
        <Badge
            variant='warning'
            label={use(pluginString('sourceoutdated'))}
            title={use(pluginString('sourceoutdated_desc'))}
            startIcon={<i className='icon fa fa-exclamation-triangle' aria-hidden='true' />}
        />
    );
}

/**
 * Render the switch deciding how a selected source is used.
 *
 * If the mode cannot be changed (read-only or only one mode supported by the source), the mode is only shown as badge
 * explaining why.
 *
 * @param props The source, its mode and the change callback.
 * @returns Switch UI.
 */
function ModeSwitch({source, mode, idPrefix, disabled, onChange}: {
    source: SourceOption;
    mode: SelectionMode;
    idPrefix: string;
    disabled: boolean;
    onChange: (mode: SelectionMode) => void;
}) {
    const unavailable = MODES.find(option => !source.modes.includes(option));
    if (disabled || unavailable !== undefined) {
        const help = unavailable === undefined ? `selector_mode_${mode}_help` : `selector_mode_${unavailable}_unavailable`;
        return (
            <Badge
                variant='secondary'
                subtle
                className='flex-shrink-0'
                label={use(pluginString(`selector_mode_${mode}`))}
                title={use(pluginString(help))}
                startIcon={<i className={`icon fa ${MODE_ICONS[mode]}`} aria-hidden='true' />}
            />
        );
    }

    return (
        <div
            className='btn-group btn-group-sm flex-shrink-0'
            role='radiogroup'
            aria-label={use(pluginString('selector_mode', source.name))}
        >
            {MODES.map(option => {
                const id = `${idPrefix}-mode-${option}`;
                return (
                    <Fragment key={option}>
                        <input
                            type='radio'
                            className='btn-check'
                            id={id}
                            name={`${idPrefix}-mode`}
                            checked={mode === option}
                            onChange={() => {
                                onChange(option);
                            }}
                        />
                        <label
                            className='btn btn-outline-primary text-nowrap'
                            htmlFor={id}
                            title={use(pluginString(`selector_mode_${option}_help`))}
                        >
                            <i className={`icon fa ${MODE_ICONS[option]} me-1`} aria-hidden='true' />
                            <MoodleString identifier={`selector_mode_${option}`} component={COMPONENT} />
                        </label>
                    </Fragment>
                );
            })}
        </div>
    );
}

/**
 * Render one source with its checkbox and, if selected, its mode switch.
 *
 * @param props The source and the row context.
 * @returns Row UI.
 */
function SourceRow({source, context}: {source: SourceOption; context: RowContext}) {
    const {idPrefix, selection, readOnly, warnChars, onToggle, onModeChange, onRemove} = context;
    const id = `${idPrefix}-${source.id}`;
    const mode = selection.get(source.id);
    const [sizeIdentifier, sizeParameter] = getSizeString(source.contentLength);
    const sizeTitle = source.contentLength === null ? use(pluginString('selector_size_unknown_help')) : undefined;
    const tooLong = mode === 'full' && warnChars > 0 && source.contentLength !== null && source.contentLength > warnChars;

    return (
        <li className='d-flex flex-wrap align-items-center gap-2 py-2'>
            <Checkbox
                id={id}
                checked={mode !== undefined}
                onChange={() => {
                    onToggle(source);
                }}
                disabled={readOnly}
                hideLabel
                label={source.name}
            />
            <SourceLabel
                htmlFor={id}
                iconUrl={source.iconUrl}
                name={source.name}
                details={(
                    <>
                        {source.typeName}
                        {source.sourceType !== 'external' && (
                            <span title={sizeTitle}>
                                {' · '}
                                <MoodleString identifier={sizeIdentifier} component={COMPONENT} params={sizeParameter} />
                            </span>
                        )}
                    </>
                )}
            />
            {source.outdated && <OutdatedBadge />}
            {mode !== undefined && onModeChange && (
                <ModeSwitch
                    source={source}
                    mode={mode}
                    idPrefix={id}
                    disabled={readOnly}
                    onChange={newMode => {
                        onModeChange(source, newMode);
                    }}
                />
            )}
            {onRemove && !readOnly && (
                <Button
                    variant='ghost'
                    size='sm'
                    title={use(pluginString('selector_removesource', source.name))}
                    aria-label={use(pluginString('selector_removesource', source.name))}
                    startIcon={<i className='icon fa fa-unlink m-0' aria-hidden='true' />}
                    onClick={() => {
                        onRemove(source);
                    }}
                />
            )}
            {tooLong && (
                <div className='w-100 small text-warning-emphasis ps-4' role='status'>
                    <i className='icon fa fa-exclamation-triangle me-1' aria-hidden='true' />
                    <MoodleString identifier='selector_fullwarning' component={COMPONENT} />
                </div>
            )}
        </li>
    );
}

/**
 * Render the checkbox selecting or deselecting all sources of a group, mixed if only some are selected.
 *
 * @param props The sources of the group, its name and the row context.
 * @returns Checkbox UI.
 */
function BulkCheckbox({id, name, sources, context}: {id: string; name: string; sources: SourceOption[]; context: RowContext}) {
    const count = sources.filter(source => context.selection.has(source.id)).length;
    return (
        <Checkbox
            id={id}
            checked={count > 0 && count === sources.length}
            indeterminate={count > 0 && count < sources.length}
            onChange={() => {
                context.onToggleAll(sources);
            }}
            disabled={context.readOnly}
            hideLabel
            label={use(pluginString('selector_selectgroup', name))}
        />
    );
}

/**
 * Return the number of selected sources of a list.
 *
 * @param sources The sources of a group or section.
 * @param selection The selected sources with their mode.
 * @returns The number of selected sources.
 */
const countSelected = (sources: SourceOption[], selection: Selection): number =>
    sources.filter(source => selection.has(source.id)).length;

/**
 * Render the sources of one course section as collapsible group.
 *
 * @param props The section, its sources and the row context.
 * @returns Section UI.
 */
function CourseSectionGroup({section, sources, initiallyExpanded, context}: {
    section: CourseSection;
    sources: SourceOption[];
    initiallyExpanded: boolean;
    context: RowContext;
}) {
    const initiallyOpen = initiallyExpanded || sources.some(source => context.selection.has(source.id));
    const [expanded, setExpanded] = useState<boolean>(initiallyOpen);
    const listId = `${context.idPrefix}-section-${section.id}`;

    return (
        <div className='border-top'>
            <div className='d-flex align-items-center gap-2 py-2'>
                <BulkCheckbox id={`${listId}-all`} name={section.name} sources={sources} context={context} />
                <SectionToggle
                    name={section.name}
                    expanded={expanded}
                    controls={listId}
                    onToggle={() => {
                        setExpanded(!expanded);
                    }}
                />
                <SelectedCount selected={countSelected(sources, context.selection)} total={sources.length} />
            </div>
            {expanded && (
                <ul id={listId} className='list-unstyled mb-0 ps-4'>
                    {sources.map(source => <SourceRow key={source.id} source={source} context={context} />)}
                </ul>
            )}
        </div>
    );
}

/**
 * Render one group of sources with a bulk checkbox, optionally split into course sections.
 *
 * @param props The string identifiers of the title and the empty text, the sources, the sections and the row context.
 * @returns Group UI.
 */
function SourceGroup({titleIdentifier, emptyIdentifier, sources, sections = [], context}: {
    titleIdentifier: string;
    emptyIdentifier: string;
    sources: SourceOption[];
    sections?: CourseSection[];
    context: RowContext;
}) {
    const title = use(pluginString(titleIdentifier));
    const groupId = `${context.idPrefix}-group`;
    const sectionsWithSources = sections
        .map(section => ({section, sources: sources.filter(source => source.sectionId === section.id)}))
        .filter(entry => entry.sources.length > 0);

    return (
        <section className='mb-4'>
            <div className='d-flex align-items-center gap-2 pb-1 border-bottom'>
                {sources.length > 0 && <BulkCheckbox id={`${groupId}-all`} name={title} sources={sources} context={context} />}
                <h6 className='mb-0 flex-grow-1'>{title}</h6>
                {sources.length > 0 && (
                    <SelectedCount selected={countSelected(sources, context.selection)} total={sources.length} />
                )}
            </div>
            {sources.length === 0 && (
                <div className='text-muted small mt-2'><MoodleString identifier={emptyIdentifier} component={COMPONENT} /></div>
            )}
            {sectionsWithSources.length > 0 && sectionsWithSources.map(entry => (
                <CourseSectionGroup
                    key={entry.section.id}
                    section={entry.section}
                    sources={entry.sources}
                    initiallyExpanded={sectionsWithSources.length === 1}
                    context={context}
                />
            ))}
            {sources.length > 0 && sectionsWithSources.length === 0 && (
                <ul className='list-unstyled mb-0'>
                    {sources.map(source => <SourceRow key={source.id} source={source} context={context} />)}
                </ul>
            )}
        </section>
    );
}

/**
 * Render the warning about too long complete contents in total.
 *
 * @param props The total number of characters of the sources read fully.
 * @returns Warning UI.
 */
function TotalWarning({length}: {length: number}) {
    const [sizeIdentifier, sizeParameter] = getSizeString(length);
    const size = use(pluginString(sizeIdentifier, sizeParameter));
    return (
        <div className='alert alert-warning small py-2' role='status'>
            <i className='icon fa fa-exclamation-triangle me-1' aria-hidden='true' />
            <MoodleString identifier='selector_totalwarning' component={COMPONENT} params={size} />
        </div>
    );
}

/**
 * Render the explanation of the selection modes.
 *
 * @returns Help UI.
 */
function ModeHelp() {
    return (
        <details className='mb-3 border rounded p-2'>
            <summary className='fw-semibold'>
                <i className='icon fa fa-circle-question me-1' aria-hidden='true' />
                <MoodleString identifier='selector_help_heading' component={COMPONENT} />
            </summary>
            <dl className='mb-0 mt-2'>
                {MODES.map(mode => (
                    <Fragment key={mode}>
                        <dt>
                            <i className={`icon fa ${MODE_ICONS[mode]} me-1`} aria-hidden='true' />
                            <MoodleString identifier={`selector_mode_${mode}`} component={COMPONENT} />
                        </dt>
                        <dd className='mb-2'>
                            <MoodleString identifier={`selector_mode_${mode}_help`} component={COMPONENT} />
                        </dd>
                    </Fragment>
                ))}
            </dl>
            <div className='small text-muted'>
                <MoodleString identifier='selector_help_tip' component={COMPONENT} />
            </div>
        </details>
    );
}

/**
 * Context source selector component.
 *
 * Renders the launch button and a modal listing the selectable sources of the given context. The selection is saved
 * via the REST API on every change.
 *
 * @param props Component props.
 * @returns The rendered component.
 */
export default function SourceSelector(props: Props) {
    return (
        <StringsProvider>
            <SourceSelectorContent {...props} />
        </StringsProvider>
    );
}

/**
 * Render the source selector once the language strings are preloaded.
 *
 * @param props Component props.
 * @returns The rendered component.
 */
function SourceSelectorContent({contextId, defaultMode = 'search'}: Props) {
    const [globalDocuments, setGlobalDocuments] = useState<SourceOption[]>([]);
    const [courseActivities, setCourseActivities] = useState<SourceOption[]>([]);
    const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
    const [courseDocuments, setCourseDocuments] = useState<SourceOption[]>([]);
    const [externalSources, setExternalSources] = useState<SourceOption[]>([]);
    const [selection, setSelection] = useState<Selection>(new Map());
    const [canSelect, setCanSelect] = useState<boolean>(false);
    const [warnChars, setWarnChars] = useState<number>(0);
    const [totalWarnChars, setTotalWarnChars] = useState<number>(0);

    const [mode, setMode] = useState<'main' | 'courses' | 'sources'>('main');
    const [importableCourses, setImportableCourses] = useState<ImportableCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
    const [importCourseActivities, setImportCourseActivities] = useState<SourceOption[]>([]);
    const [importCourseDocuments, setImportCourseDocuments] = useState<SourceOption[]>([]);
    const [stagedImportSelection, setStagedImportSelection] = useState<Selection>(new Map());

    const [loading, setLoading] = useState<boolean>(true);
    const [loadingImportView, setLoadingImportView] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalBodyRoot, setModalBodyRoot] = useState<HTMLElement | null>(null);
    const modalReference = useRef<MoodleModal | null>(null);
    const pendingSaves = useRef<number>(0);

    const listedSources = [...globalDocuments, ...courseActivities, ...courseDocuments, ...externalSources];
    // Chat requests use the selected sources, so warn if at least one of them is answered from outdated content.
    const hasOutdatedSelection = listedSources.some(source => source.outdated && selection.has(source.id));
    const hasOutdatedSources = listedSources.some(source => source.outdated);
    const fullLength = listedSources
        .filter(source => selection.get(source.id) === 'full')
        .reduce((sum, source) => sum + (source.contentLength ?? 0), 0);
    const launcherTitle = hasOutdatedSelection
        ? `${use(pluginString('selector_launcher'))} – ${use(pluginString('selectedsourcesoutdated'))}`
        : use(pluginString('selector_launcher'));

    /**
     * Report an error with a language string.
     *
     * @param identifier The string identifier of the error message.
     */
    const showError = (identifier: string) => {
        pluginString(identifier).then(setError).catch(() => undefined);
    };

    /**
     * Load the sources and the selection of the context into the component state.
     *
     * @param reload Whether to bypass the cache of the data manager.
     */
    const loadSelection = (reload: boolean) => {
        setLoading(true);
        setError(null);

        loadSourceSelection(contextId, reload)
            .then(loaded => {
                setGlobalDocuments(loaded.globalDocuments);
                setCourseActivities(loaded.courseActivities);
                setCourseSections(loaded.courseSections);
                setCourseDocuments(loaded.courseDocuments);
                setExternalSources(loaded.externalSources);
                setSelection(new Map(loaded.selectedSourceIds.map(id => [
                    id,
                    loaded.fullSourceIds.includes(id) ? 'full' : 'search',
                ])));
                setCanSelect(loaded.canSelect);
                setWarnChars(loaded.fullContentWarnChars);
                setTotalWarnChars(loaded.fullContentTotalWarnChars);
                setLoading(false);
                return loaded;
            })
            .catch(() => {
                showError('selector_loaderror');
                setLoading(false);
            });
    };

    useEffect(() => {
        loadSelection(false);
    }, [contextId]);

    /**
     * Apply a new selection and persist it immediately.
     *
     * @param next The new selection.
     */
    const updateSelection = async (next: Selection) => {
        setSelection(next);
        setSaveSuccess(false);
        setError(null);
        setSaving(true);
        pendingSaves.current++;
        try {
            const ids: number[] = [];
            const fullIds: number[] = [];
            for (const [id, selectedMode] of next) {
                ids.push(id);
                if (selectedMode === 'full') {
                    fullIds.push(id);
                }
            }

            await saveSelectedSourceIds(contextId, ids, fullIds);
            setSaveSuccess(true);
        } catch {
            showError('selector_saveerror');
            // Roll back to the selection actually stored on the server.
            try {
                const stored = await loadSourceSelection(contextId, true);
                setExternalSources(stored.externalSources);
                setSelection(new Map(stored.selectedSourceIds.map(id => [
                    id,
                    stored.fullSourceIds.includes(id) ? 'full' : 'search',
                ])));
            } catch {
                // Keep the error message, the selection is reloaded the next time the selector is opened.
            }
        } finally {
            pendingSaves.current--;
            if (pendingSaves.current === 0) {
                setSaving(false);
            }
        }
    };

    const handleToggle = (source: SourceOption) => {
        const next = new Map(selection);
        if (next.has(source.id)) {
            next.delete(source.id);
        } else {
            next.set(source.id, chooseMode(source, defaultMode));
        }

        void updateSelection(next);
    };

    const handleToggleAll = (sources: SourceOption[]) => {
        const next = new Map(selection);
        const allSelected = sources.every(source => next.has(source.id));
        for (const source of sources) {
            if (allSelected) {
                next.delete(source.id);
            } else if (!next.has(source.id)) {
                next.set(source.id, chooseMode(source, defaultMode));
            }
        }

        void updateSelection(next);
    };

    const handleModeChange = (source: SourceOption, newMode: SelectionMode) => {
        const next = new Map(selection);
        next.set(source.id, newMode);
        void updateSelection(next);
    };

    const handleRemoveExternalSource = (source: SourceOption) => {
        setExternalSources(previous => previous.filter(external => external.id !== source.id));
        const next = new Map(selection);
        next.delete(source.id);
        void updateSelection(next);
    };

    const toggleStaged = (sources: SourceOption[], select: boolean) => {
        setStagedImportSelection(previous => {
            const next = new Map(previous);
            for (const source of sources) {
                if (select) {
                    next.set(source.id, chooseMode(source, defaultMode));
                } else {
                    next.delete(source.id);
                }
            }

            return next;
        });
    };

    const loadImportableCourses = async () => {
        setLoadingImportView(true);
        setError(null);
        try {
            const response = await Fetch.performGet(
                'local_ai_content',
                `contexts/${contextId}/source-selections/importable-courses`,
            );
            const data = await response.json() as ImportableCoursesResponse;
            const courses = data.items;
            setImportableCourses(courses);
            // There may be no importable course at all.
            setSelectedCourseId(courses[0]?.id ?? 0);
        } catch {
            showError('selector_loadcourseserror');
        } finally {
            setLoadingImportView(false);
        }
    };

    const openCourseSelection = async () => {
        setMode('courses');
        setImportCourseActivities([]);
        setImportCourseDocuments([]);
        setStagedImportSelection(new Map());
        await loadImportableCourses();
    };

    const loadImportableSources = async () => {
        if (selectedCourseId <= 0) {
            return;
        }

        setLoadingImportView(true);
        setError(null);
        try {
            const response = await Fetch.performGet(
                'local_ai_content',
                `contexts/${contextId}/source-selections/importable-sources?sourceCourseId=${selectedCourseId}`,
            );
            const data = await response.json() as ImportableSourcesResponse;
            const item = data.items[0];
            const existingExternalIds = new Set(externalSources.map(source => source.id));
            const activities = item.courseActivities.filter(source => !existingExternalIds.has(source.id));
            const documents = item.courseDocuments.filter(source => !existingExternalIds.has(source.id));
            const nextStaged: Selection = new Map();
            for (const source of [...activities, ...documents]) {
                const selectedMode = selection.get(source.id);
                if (selectedMode !== undefined) {
                    nextStaged.set(source.id, selectedMode);
                }
            }

            setImportCourseActivities(activities);
            setImportCourseDocuments(documents);
            setStagedImportSelection(nextStaged);
            setMode('sources');
        } catch {
            showError('selector_loadimportsourceserror');
        } finally {
            setLoadingImportView(false);
        }
    };

    const addSelectedExternalSources = () => {
        const importableSources = [...importCourseActivities, ...importCourseDocuments];
        const localIds = new Set([...globalDocuments, ...courseActivities, ...courseDocuments].map(source => source.id));

        setExternalSources(previous => {
            const existingIds = new Set(previous.map(source => source.id));
            const added = importableSources.filter(source => stagedImportSelection.has(source.id)
                && !existingIds.has(source.id) && !localIds.has(source.id));
            return [...previous, ...added].sort((a, b) => a.name.localeCompare(b.name));
        });

        setMode('main');
        const next = new Map(selection);
        for (const [id, stagedMode] of stagedImportSelection) {
            next.set(id, stagedMode);
        }

        void updateSelection(next);
    };

    useEffect(() => () => {
        if (!modalReference.current) {
            return;
        }

        void closeModal(modalReference.current);
        modalReference.current = null;
    }, []);

    const openSelectorModal = async () => {
        if (modalReference.current) {
            return;
        }

        // Sources may have finished indexing meanwhile, so refresh the list unless a save is still in progress.
        if (pendingSaves.current === 0) {
            loadSelection(true);
        }

        const modalResult = await openModal({
            title: await pluginString('selector_launcher'),
            onShown() {
                setIsModalOpen(true);
            },
            onHidden() {
                setIsModalOpen(false);
                setModalBodyRoot(null);
                modalReference.current = null;
            },
        });
        modalReference.current = modalResult.modal;
        setModalBodyRoot(modalResult.bodyRoot);
    };

    const rowContext = (idPrefix: string, onRemove?: (source: SourceOption) => void): RowContext => ({
        idPrefix: `local_ai_content-source-selector-${contextId}-${idPrefix}`,
        selection,
        readOnly: !canSelect,
        warnChars,
        onToggle: handleToggle,
        onModeChange: handleModeChange,
        onRemove,
        onToggleAll: handleToggleAll,
    });

    const importRowContext = (idPrefix: string): RowContext => ({
        idPrefix: `local_ai_content-source-selector-${contextId}-import-${idPrefix}`,
        selection: stagedImportSelection,
        readOnly: false,
        warnChars: 0,
        onToggle(source) {
            toggleStaged([source], !stagedImportSelection.has(source.id));
        },
        onToggleAll(sources) {
            toggleStaged(sources, sources.some(source => !stagedImportSelection.has(source.id)));
        },
    });

    const renderError = () => error !== null && <div className='text-danger small mt-2' role='alert'>{error}</div>;

    const renderCoursesContent = () => (
        <div className='local_ai_content-source-selector'>
            <div className='d-flex justify-content-between align-items-center mb-3'>
                <h6 className='mb-0'><MoodleString identifier='selector_choosecourse' component={COMPONENT} /></h6>
                <StringButton
                    variant='ghost'
                    identifier='back'
                    component='core'
                    onClick={() => {
                        setMode('main');
                    }}
                    disabled={loadingImportView || saving}
                />
            </div>

            {loadingImportView && <div className='text-muted small mb-2'><MoodleString identifier='loading' /></div>}
            {!loadingImportView && importableCourses.length === 0 && (
                <div className='text-muted small mb-2'><MoodleString identifier='selector_nocourses' component={COMPONENT} /></div>
            )}
            {!loadingImportView && importableCourses.length > 0 && (
                <>
                    <div className='mb-3'>
                        <label className='form-label' htmlFor={`source-selector-import-course-${contextId}`}>
                            <MoodleString identifier='selector_course' component={COMPONENT} />
                        </label>
                        <select
                            id={`source-selector-import-course-${contextId}`}
                            className='form-select'
                            value={selectedCourseId}
                            onChange={event => {
                                setSelectedCourseId(Number(event.target.value));
                            }}
                            disabled={saving}
                        >
                            {importableCourses.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>
                    <StringButton
                        variant='primary'
                        identifier='selector_loadsources'
                        onClick={() => {
                            void loadImportableSources();
                        }}
                        disabled={selectedCourseId <= 0 || saving || loadingImportView}
                    />
                </>
            )}

            {renderError()}
        </div>
    );

    const renderImportSourcesContent = () => {
        const courseName = importableCourses.find(course => course.id === selectedCourseId)?.name ?? '';
        return (
            <div className='local_ai_content-source-selector'>
                <div className='d-flex justify-content-between align-items-center mb-3'>
                    <h6 className='mb-0'>
                        <MoodleString identifier='selector_importtitle' component={COMPONENT} params={courseName} />
                    </h6>
                    <StringButton
                        variant='ghost'
                        identifier='selector_changecourse'
                        onClick={() => {
                            setMode('courses');
                        }}
                        disabled={loadingImportView || saving}
                    />
                </div>

                <SourceGroup
                    titleIdentifier='selector_courseactivities'
                    emptyIdentifier='selector_nocourseactivities'
                    sources={importCourseActivities}
                    context={importRowContext('activities')}
                />
                <SourceGroup
                    titleIdentifier='selector_coursedocuments'
                    emptyIdentifier='selector_nocoursedocuments'
                    sources={importCourseDocuments}
                    context={importRowContext('documents')}
                />

                <div className='d-flex gap-2 mt-3'>
                    <StringButton
                        variant='secondary'
                        identifier='cancel'
                        component='core'
                        onClick={() => {
                            setMode('main');
                        }}
                        disabled={saving}
                    />
                    <StringButton
                        variant='primary'
                        identifier='add'
                        component='core'
                        onClick={addSelectedExternalSources}
                        disabled={saving || stagedImportSelection.size === 0}
                    />
                </div>

                {renderError()}
            </div>
        );
    };

    const renderMainContent = () => (
        <div className='local_ai_content-source-selector'>
            <p className='mb-2'><MoodleString identifier='selector_intro' component={COMPONENT} /></p>
            <ModeHelp />
            {!canSelect && (
                <div className='alert alert-info small py-2' role='status'>
                    <MoodleString identifier='selector_readonly' component={COMPONENT} />
                </div>
            )}
            {hasOutdatedSources && (
                <div className='alert alert-warning small py-2' role='status'>
                    <i className='icon fa fa-exclamation-triangle me-1' aria-hidden='true' />
                    <MoodleString identifier='sourceoutdated_desc' component={COMPONENT} />
                </div>
            )}
            {totalWarnChars > 0 && fullLength > totalWarnChars && <TotalWarning length={fullLength} />}
            <SourceGroup
                titleIdentifier='selector_courseactivities'
                emptyIdentifier='selector_nocourseactivities'
                sources={courseActivities}
                sections={courseSections}
                context={rowContext('activities')}
            />
            <SourceGroup
                titleIdentifier='selector_coursedocuments'
                emptyIdentifier='selector_nocoursedocuments'
                sources={courseDocuments}
                context={rowContext('documents')}
            />
            <SourceGroup
                titleIdentifier='selector_globaldocuments'
                emptyIdentifier='selector_noglobaldocuments'
                sources={globalDocuments}
                context={rowContext('global')}
            />
            <SourceGroup
                titleIdentifier='selector_externalsources'
                emptyIdentifier='selector_noexternalsources'
                sources={externalSources}
                context={rowContext('external', handleRemoveExternalSource)}
            />

            {canSelect && (
                <div className='mb-3'>
                    <StringButton
                        variant='outline-secondary'
                        identifier='selector_addsource'
                        startIcon={<i className='icon fa fa-plus' aria-hidden='true' />}
                        onClick={() => {
                            void openCourseSelection();
                        }}
                        disabled={saving || loadingImportView}
                    />
                </div>
            )}

            <div className='local_ai_content-source-selector__actions mt-2 d-flex align-items-center gap-3' aria-live='polite'>
                {saving && (
                    <span className='text-muted small'><MoodleString identifier='selector_saving' component={COMPONENT} /></span>
                )}
                {!saving && saveSuccess && (
                    <span className='text-success small'><MoodleString identifier='selector_saved' component={COMPONENT} /></span>
                )}
                {renderError()}
            </div>
        </div>
    );

    const renderSelectorContent = () => {
        if (loading) {
            return <div className='text-muted'><MoodleString identifier='selector_loading' component={COMPONENT} /></div>;
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
                type='button'
                className='btn btn-icon icon-no-margin p-0 local_ai_content-source-selector-launcher'
                title={launcherTitle}
                aria-label={launcherTitle}
                onClick={() => {
                    void openSelectorModal();
                }}
            >
                <i className='fa fa-paperclip' aria-hidden='true' />
                {hasOutdatedSelection && (
                    <i
                        className='fa fa-exclamation-triangle local_ai_content-source-selector-outdated'
                        aria-hidden='true'
                    />
                )}
            </button>

            {isModalOpen && modalBodyRoot && createPortal(renderSelectorContent(), modalBodyRoot)}
        </>
    );
}

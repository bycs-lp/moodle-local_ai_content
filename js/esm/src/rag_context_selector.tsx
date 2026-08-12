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
 * @module     local_ai_content/rag_context_selector
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {useState, useEffect} from 'react';
import Fetch from '@moodle/lms/core/fetch';
// @ts-ignore - path resolved via Moodle import map at runtime
import {Button} from '@moodlehq/design-system';
// @ts-ignore - path resolved via Moodle import map at runtime
import {Checkbox} from '@moodlehq/design-system';

/** A single selectable source returned by the API. */
type SourceOption = {
    id: number;
    cmid: number;
    name: string;
    sourcetype?: string;
};

/** Shape of the GET /ragcontext/{contextid} response. */
type ContextSourceSelectionResponse = {
    availablesources: SourceOption[];
    selectedsourceids: string;
};

/** Component props passed from the Mustache template via data-react-props. */
type Props = {
    /** The Moodle context ID for which source selection is managed. */
    contextid: number;
};

type RagSelectionBridge = {
    getSelected: (contextid: number) => string;
    getRequestData: (contextid: number) => {selectedsourceids: string};
};

const BRIDGE_KEY = 'localAiContentRagSelection';
const selectioncache = new Map<number, string>();

/**
 * Ensure the global bridge object exists and return it.
 *
 * External usage example:
 *   const api = (window as unknown as {[key: string]: unknown})['localAiContentRagSelection'] as RagSelectionBridge;
 *   const requestdata = api.getRequestData(contextid);
 *
 * @returns {RagSelectionBridge} The global bridge.
 */
function getRagSelectionBridge(): RagSelectionBridge {
    const scope = window as unknown as {[key: string]: unknown};
    const existing = scope[BRIDGE_KEY] as RagSelectionBridge | undefined;
    if (existing && typeof existing.getSelected === 'function' && typeof existing.getRequestData === 'function') {
        return existing;
    }

    const bridge: RagSelectionBridge = {
        getSelected(contextid: number): string {
            return selectioncache.get(contextid) ?? '';
        },
        getRequestData(contextid: number): {selectedsourceids: string} {
            return {selectedsourceids: selectioncache.get(contextid) ?? ''};
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
 * Context source selector component.
 *
 * Renders a checkbox list of selectable sources for the given contextid and saves
 * the source selection via the REST API.
 *
 * @param {Props} props Component props.
 * @returns {JSX.Element} The rendered component.
 */
export default function RagContextSelector({contextid}: Props) {
    const [availablesources, setAvailablesources] = useState<SourceOption[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const bridge = getRagSelectionBridge();

    useEffect(() => {
        setLoading(true);
        setError(null);

        Fetch.performGet('local_ai_content', `ragcontext/${contextid}`)
            .then((res: Response) => res.json() as Promise<ContextSourceSelectionResponse>)
            .then((data: ContextSourceSelectionResponse) => {
                setAvailablesources(data.availablesources ?? []);
                const selectedsourceids = data.selectedsourceids ?? '';
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

    const handleSave = async() => {
        setSaving(true);
        setSaveSuccess(false);
        setError(null);

        publishSelected(contextid, [...selected].join(','));
        const requestdata = bridge.getRequestData(contextid);

        const res = await Fetch.performPost(
            'local_ai_content',
            `ragcontext/${contextid}`,
            {body: JSON.stringify(requestdata)},
        );

        if (!res.ok) {
            setError(`Failed to save source selection for this context (HTTP ${res.status}).`);
        } else {
            setSaveSuccess(true);
        }

        setSaving(false);
    };

    useEffect(() => {
        publishSelected(contextid, [...selected].join(','));
    }, [contextid, selected]);

    if (loading) {
        return <div className="rag-context-selector rag-context-selector--loading">Loading…</div>;
    }

    if (availablesources.length === 0) {
        return (
            <div className="rag-context-selector rag-context-selector--empty">
                No selectable sources found for this context.
            </div>
        );
    }

    return (
        <div className="rag-context-selector">
            <ul className="rag-context-selector__list list-unstyled">
                {availablesources.map((source) => (
                    <li key={source.id} className="rag-context-selector__item">
                        <Checkbox
                            id={`rag-context-source-${contextid}-${source.id}`}
                            checked={selected.has(source.id)}
                            onChange={() => handleToggle(source.id)}
                            label={source.name}
                            supportingText={source.sourcetype ?? ''}
                        />
                    </li>
                ))}
            </ul>

            <div className="rag-context-selector__actions mt-2 d-flex align-items-center gap-3">
                <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    label={saving ? 'Saving…' : 'Save selected sources for this context'}
                />

                {saveSuccess && (
                    <span className="text-success small">✓ Saved</span>
                )}
                {error && (
                    <span className="text-danger small">{error}</span>
                )}
            </div>
        </div>
    );
}



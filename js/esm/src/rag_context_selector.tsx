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
 * React component for selecting RAG context (indexable activities) for a given context.
 *
 * @module     local_ai_content/rag_context_selector
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {useState, useEffect} from 'react';
// @ts-ignore - path resolved via Moodle import map at runtime
import Fetch from '@moodle/lms/core/fetch';

/** A single indexable activity returned by the API. */
type Activity = {
    id: number;
    cmid: number;
    name: string;
};

/** Shape of the GET /ragcontext/{contextid} response. */
type RagContextResponse = {
    available: Activity[];
    selected: string;
};

/** Component props passed from the Mustache template via data-react-props. */
type Props = {
    /** The Moodle context ID for which RAG selection is managed. */
    contextid: number;
};

type RagSelectionBridge = {
    setSelected: (contextid: number, ragrecordids: string) => void;
    getSelected: (contextid: number) => string;
};

const BRIDGE_KEY = 'localAiContentRagSelection';

/**
 * Ensure the global bridge object exists and return it.
 *
 * @returns {RagSelectionBridge} The global bridge.
 */
function getRagSelectionBridge(): RagSelectionBridge {
    const scope = window as unknown as {[key: string]: unknown};
    const existing = scope[BRIDGE_KEY] as RagSelectionBridge | undefined;
    if (existing && typeof existing.getSelected === 'function' && typeof existing.setSelected === 'function') {
        return existing;
    }

    const cache = new Map<number, string>();
    const bridge: RagSelectionBridge = {
        setSelected(contextid: number, ragrecordids: string): void {
            cache.set(contextid, ragrecordids);
        },
        getSelected(contextid: number): string {
            return cache.get(contextid) ?? '';
        },
    };
    scope[BRIDGE_KEY] = bridge;
    return bridge;
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
 * RAG Context Selector component.
 *
 * Renders a checkbox list of indexable activities for the course associated with
 * the given contextid. Saves the selection via the REST API.
 *
 * @param {Props} props Component props.
 * @returns {JSX.Element} The rendered component.
 */
export default function RagContextSelector({contextid}: Props) {
    const [available, setAvailable] = useState<Activity[]>([]);
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
            .then((res: Response) => res.json() as Promise<RagContextResponse>)
            .then((data: RagContextResponse) => {
                setAvailable(data.available ?? []);
                const selectedraw = data.selected ?? '';
                setSelected(parseIds(selectedraw));
                bridge.setSelected(contextid, selectedraw);
                setLoading(false);
                return data;
            })
            .catch(() => {
                setError('Failed to load RAG context data.');
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

        const ragrecordids = [...selected].join(',');

        const res = await Fetch.performPost(
            'local_ai_content',
            `ragcontext/${contextid}`,
            {body: JSON.stringify({ragrecordids})},
        );

        if (!res.ok) {
            setError(`Failed to save RAG context selection (HTTP ${res.status}).`);
        } else {
            setSaveSuccess(true);
        }

        setSaving(false);
    };

    useEffect(() => {
        bridge.setSelected(contextid, [...selected].join(','));
    }, [bridge, contextid, selected]);

    if (loading) {
        return <div className="rag-context-selector rag-context-selector--loading">Loading…</div>;
    }

    if (available.length === 0) {
        return (
            <div className="rag-context-selector rag-context-selector--empty">
                No indexable activities found in this course.
            </div>
        );
    }

    return (
        <div className="rag-context-selector">
            <ul className="rag-context-selector__list list-unstyled">
                {available.map((activity) => (
                    <li key={activity.id} className="rag-context-selector__item">
                        <label className="d-flex align-items-center gap-2">
                            <input
                                type="checkbox"
                                value={activity.id}
                                checked={selected.has(activity.id)}
                                onChange={() => handleToggle(activity.id)}
                                className="form-check-input"
                            />
                            <span>{activity.name}</span>
                        </label>
                    </li>
                ))}
            </ul>

            <div className="rag-context-selector__actions mt-2 d-flex align-items-center gap-3">
                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving…' : 'Save selection'}
                </button>

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





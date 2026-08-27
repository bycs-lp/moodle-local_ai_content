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
 * Global source selector API shared between React UI and legacy AMD modules.
 *
 * @module     local_ai_content/source_selector
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const API_KEY = 'localAiContentSourceSelectorApi';

const normalizeContextId = (contextid) => {
    const normalizedcontextid = parseInt(contextid, 10);
    if (isNaN(normalizedcontextid) || normalizedcontextid <= 0) {
        return 0;
    }

    return normalizedcontextid;
};

const normalizeSourceIds = (sourceids) => {
    if (Array.isArray(sourceids)) {
        return sourceids
            .map((id) => parseInt(id, 10))
            .filter((id) => !isNaN(id) && id > 0);
    }

    if (typeof sourceids === 'string') {
        return sourceids
            .split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id) && id > 0);
    }

    return [];
};

const ensureApi = () => {
    const scope = window;
    const existing = scope[API_KEY];
    if (
        existing
        && typeof existing.init === 'function'
        && typeof existing.getSelectedSourceIds === 'function'
        && typeof existing.setSelectedSourceIds === 'function'
        && typeof existing.subscribe === 'function'
        && typeof existing.unsubscribe === 'function'
    ) {
        return existing;
    }

    const contextcache = new Map();
    const subscribers = new Map();

    const notifySubscribers = (normalizedcontextid, sourceids) => {
        const listeners = subscribers.get(normalizedcontextid);
        if (!listeners || listeners.size === 0) {
            return;
        }

        listeners.forEach((listener) => {
            listener([...sourceids]);
        });
    };

    const api = {
        init(contextid, sourceids = []) {
            const normalizedcontextid = normalizeContextId(contextid);
            if (normalizedcontextid > 0) {
                this.setSelectedSourceIds(normalizedcontextid, sourceids);
            }
            return this;
        },

        getSelectedSourceIds(contextid) {
            const normalizedcontextid = normalizeContextId(contextid);
            if (normalizedcontextid <= 0) {
                return [];
            }

            return [...(contextcache.get(normalizedcontextid) ?? [])];
        },

        setSelectedSourceIds(contextid, sourceids) {
            const normalizedcontextid = normalizeContextId(contextid);
            if (normalizedcontextid <= 0) {
                return;
            }

            const normalizedsourceids = normalizeSourceIds(sourceids);
            contextcache.set(normalizedcontextid, normalizedsourceids);
            notifySubscribers(normalizedcontextid, normalizedsourceids);
        },

        subscribe(contextid, callback) {
            const normalizedcontextid = normalizeContextId(contextid);
            if (normalizedcontextid <= 0 || typeof callback !== 'function') {
                return () => undefined;
            }

            const listeners = subscribers.get(normalizedcontextid) ?? new Set();
            listeners.add(callback);
            subscribers.set(normalizedcontextid, listeners);

            return () => {
                this.unsubscribe(normalizedcontextid, callback);
            };
        },

        unsubscribe(contextid, callback) {
            const normalizedcontextid = normalizeContextId(contextid);
            if (normalizedcontextid <= 0 || typeof callback !== 'function') {
                return;
            }

            const listeners = subscribers.get(normalizedcontextid);
            if (!listeners) {
                return;
            }

            listeners.delete(callback);
            if (listeners.size === 0) {
                subscribers.delete(normalizedcontextid);
            }
        },
    };

    scope[API_KEY] = api;
    return api;
};

export const init = (contextid, sourceids = []) => {
    const api = ensureApi();
    if (contextid !== null && typeof contextid !== 'undefined') {
        setSelectedSourceIds(contextid, sourceids);
    }
    return api;
};

export const getSelectedSourceIds = (contextid) => {
    return ensureApi().getSelectedSourceIds(contextid);
};

export const setSelectedSourceIds = (contextid, sourceids) => {
    ensureApi().setSelectedSourceIds(contextid, sourceids);
};

export const subscribe = (contextid, callback) => {
    return ensureApi().subscribe(contextid, callback);
};

export const unsubscribe = (contextid, callback) => {
    ensureApi().unsubscribe(contextid, callback);
};

// Ensure the shared API singleton exists as soon as this module is loaded.
ensureApi();



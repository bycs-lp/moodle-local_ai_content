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
 * Preloading of the language strings used by the React UIs of this plugin.
 *
 * Wrap the root of a UI in StringsProvider once; afterwards every use(pluginString(...)) or use(getString(...)) of a
 * preloaded string resolves synchronously, without own Suspense boundaries or state per string.
 *
 * @module     local_ai_content/strings
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {Suspense, use, type ReactNode} from 'react';
import {
    getComponentStrings,
    getString,
    getStrings,
    type StringParams,
} from '@moodle/lms/core/stringUtils';

/** Component of the language strings. */
export const COMPONENT = 'local_ai_content';

/** The core strings used by the UIs of this plugin. */
const CORE_STRINGS = [
    'actions',
    'add',
    'back',
    'cancel',
    'content',
    'delete',
    'description',
    'loading',
    'name',
    'next',
    'previous',
    'required',
    'savechanges',
    'status',
];

/** The preload promise, created once per page. */
let preloadPromise: Promise<unknown> | null = null;

/**
 * Load all strings of this plugin and the used core strings into the string cache.
 *
 * @returns The stable promise resolving once the strings are cached.
 */
/* eslint-disable-next-line @typescript-eslint/promise-function-async -- use() needs the stable cached promise. */
const preloadStrings = (): Promise<unknown> => {
    preloadPromise ??= Promise.all([
        getComponentStrings(COMPONENT),
        // A failed preload is not fatal: strings missing in the cache are then fetched one by one when used.
        getStrings(CORE_STRINGS.map(key => ({key, component: 'core'}))).catch(() => null),
    ]);
    return preloadPromise;
};

/**
 * Request a language string of this plugin.
 *
 * @param identifier The string identifier.
 * @param parameters The string parameters.
 * @returns The stable string promise, to be resolved with use().
 */
/* eslint-disable-next-line @typescript-eslint/promise-function-async -- use() needs the stable cached promise. */
export const pluginString = (identifier: string, parameters?: StringParams): Promise<string> =>
    getString(identifier, COMPONENT, parameters);

/**
 * Render the children once the strings are preloaded.
 *
 * @param props The children.
 * @returns The children.
 */
function Preloaded({children}: {children: ReactNode}) {
    use(preloadStrings());
    return <>{children}</>;
}

/**
 * The single Suspense boundary of a UI: renders the fallback until the strings are preloaded.
 *
 * @param props The children and the fallback shown while loading.
 * @returns The provider UI.
 */
export function StringsProvider({children, fallback = null}: {children: ReactNode; fallback?: ReactNode}) {
    return (
        <Suspense fallback={fallback}>
            <Preloaded>{children}</Preloaded>
        </Suspense>
    );
}


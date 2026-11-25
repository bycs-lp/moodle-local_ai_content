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
 * UI parts shared by the source selector and the source management, so both list sources alike.
 *
 * @module     local_ai_content/source_ui
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {type ReactNode, use} from 'react';
import {Button} from '@moodlehq/design-system';
import {COMPONENT, pluginString} from './strings';
import MoodleString from '@moodle/lms/core/String';

/**
 * Render the number of selected sources of a group.
 *
 * @param props The number of selected sources and the number of all sources of the group.
 * @returns Count UI.
 */
export function SelectedCount({selected, total}: {selected: number; total: number}) {
    return (
        <span className='small text-muted text-nowrap'>
            <MoodleString identifier='selector_selectedcount' component={COMPONENT} params={{selected, total}} />
        </span>
    );
}

/**
 * Render the button expanding or collapsing the sources of a course section.
 *
 * @param props The name of the section, whether it is expanded, the id of the expanded element and the toggle callback.
 * @returns Toggle UI.
 */
export function SectionToggle({name, expanded, controls, onToggle}: {
    name: string;
    expanded: boolean;
    controls?: string;
    onToggle: () => void;
}) {
    return (
        <Button
            variant='ghost'
            className='flex-grow-1 justify-content-start fw-semibold text-start px-1'
            aria-expanded={expanded}
            aria-controls={controls}
            title={use(pluginString('selector_toggle', name))}
            startIcon={<i className={`icon fa fa-fw m-0 fa-chevron-${expanded ? 'down' : 'right'}`} aria-hidden='true' />}
            label={name}
            onClick={onToggle}
        />
    );
}

/**
 * Render the icon and the name of a source with its type (and further details) below.
 *
 * @param props The id of the checkbox of the source, its icon url (empty for none), name, details and the url the name links to.
 * @returns Label UI.
 */
export function SourceLabel({htmlFor, iconUrl, name, details, url}: {
    htmlFor: string;
    iconUrl: string;
    name: string;
    details: ReactNode;
    url?: string | null;
}) {
    return (
        <label htmlFor={htmlFor} className='flex-grow-1 mb-0 d-flex align-items-center gap-2'>
            {iconUrl === ''
                ? <i className='icon fa fa-file-lines fa-fw m-0' aria-hidden='true' />
                : <img src={iconUrl} className='icon activityicon m-0' alt='' />}
            <span className='d-flex flex-column'>
                {url === undefined || url === null ? <span>{name}</span> : <a href={url}>{name}</a>}
                <span className='small text-muted'>{details}</span>
            </span>
        </label>
    );
}


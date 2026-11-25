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
 * Preview of the plain text AI features get from a source, e.g. the text extracted from an activity or a file.
 *
 * Independent of where it is shown; the source management renders it into a modal.
 *
 * @module     local_ai_content/content_preview
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {COMPONENT} from './strings';
import MoodleString from '@moodle/lms/core/String';

/**
 * Render the text of a source, a loading hint while it is loaded or the reason it could not be.
 *
 * @param props The text, null while it is being loaded, and the error message if loading failed.
 * @returns Preview UI.
 */
export default function ContentPreview({content, error = null}: {
    content: string | null;
    error?: string | null;
}) {
    if (error !== null) {
        return <div className='alert alert-danger mb-0' role='alert'>{error}</div>;
    }

    if (content === null) {
        return <div className='text-muted'><MoodleString identifier='preview_loading' component={COMPONENT} /></div>;
    }

    if (content.trim() === '') {
        return <div className='text-muted'><MoodleString identifier='preview_empty' component={COMPONENT} /></div>;
    }

    return <div className='local_ai_content-content-preview border rounded p-2 bg-light'>{content}</div>;
}


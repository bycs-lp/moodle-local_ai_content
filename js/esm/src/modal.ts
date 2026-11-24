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
 * Moodle core modals with a mount target for React content.
 *
 * @module     local_ai_content/modal
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {requireAsync} from '@moodle/lms/core/amd';
import {getString} from '@moodle/lms/core/stringUtils';

/** The parts of the jQuery wrapped modal root element used here. */
type ModalRoot = {
    [index: number]: HTMLElement;
    on: (event: string, handler: (event: {preventDefault: () => void}) => void) => void;
};

export type MoodleModal = {
    getRoot: () => ModalRoot;
    setBody: (value: string) => void;
    show: () => Promise<void>;
    hide: () => Promise<void>;
};

/** The parts of the AMD modules core/modal_cancel and core/modal_save_cancel used here. */
type ModalModule = {
    create: (config: {
        title: string;
        body: string;
        large: boolean;
        removeOnClose: boolean;
        buttons: Record<string, string>;
    }) => Promise<MoodleModal>;
};

/** The parts of the AMD module core/modal_events used here. */
type ModalEventsModule = {
    shown: string;
    hidden: string;
    save: string;
};

/** Options for opening a modal. */
type ModalOptions = {
    title: string;
    /** Label of the save button. Without it, the modal only has a close button. */
    saveLabel?: string;
    /** Called on save; the modal stays open, close it with {@link closeModal} once saved. */
    onSave?: () => void;
    onShown?: () => void;
    onHidden?: () => void;
};

/** The region the React content is mounted into. */
const BODY_REGION = 'local_ai_content-modal-body';

/**
 * Open a large Moodle core modal and provide a mount target for React content.
 *
 * @param options Title, save button and callbacks of the modal.
 * @returns The modal and the element to render its body into.
 */
export const openModal = async (options: ModalOptions): Promise<{modal: MoodleModal; bodyRoot: HTMLElement}> => {
    const withSave = options.saveLabel !== undefined;
    const modalType = await requireAsync<ModalModule>(withSave ? 'core/modal_save_cancel' : 'core/modal_cancel');
    const modalEvents = await requireAsync<ModalEventsModule>('core/modal_events');

    const modal = await modalType.create({
        title: options.title,
        body: '',
        large: true,
        removeOnClose: true,
        buttons: withSave ? {save: options.saveLabel!} : {cancel: await getString('closebuttontitle', 'core')},
    });

    const root = modal.getRoot();
    modal.setBody(`<div data-region="${BODY_REGION}"></div>`);
    const bodyRoot = root[0].querySelector<HTMLElement>(`[data-region="${CSS.escape(BODY_REGION)}"]`)!;

    root.on(modalEvents.save, event => {
        // Keep the modal open, e.g. to show validation errors.
        event.preventDefault();
        options.onSave?.();
    });
    if (options.onShown) {
        root.on(modalEvents.shown, options.onShown);
    }

    if (options.onHidden) {
        root.on(modalEvents.hidden, options.onHidden);
    }

    await modal.show();
    return {modal, bodyRoot};
};

/**
 * Close a modal opened with {@link openModal}.
 *
 * @param modal The modal to close.
 */
export const closeModal = async (modal: MoodleModal): Promise<void> => {
    await modal.hide();
};

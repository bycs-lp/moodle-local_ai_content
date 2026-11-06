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
 * Legacy Moodle modal manager for the source selector React component.
 *
 * @module     local_ai_content/source_selector/source_selection_modal_manager
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {requireAsync} from '@moodle/lms/core/amd';

export type MoodleModal = {
    getRoot: () => any;
    setBody: (value: string) => void;
    show: () => Promise<void>;
    hide: () => Promise<void>;
};

/** The parts of the AMD module core/modal_cancel used here. */
type ModalCancelModule = {
    create: (config: {
        title: string;
        body: string;
        large: boolean;
        removeOnClose: boolean;
        buttons: {cancel: string};
    }) => Promise<MoodleModal>;
};

/** The parts of the AMD module core/str used here. */
type StrModule = {
    getString: (key: string, component: string) => Promise<string>;
};

/** The parts of the AMD module core/modal_events used here. */
type ModalEventsModule = {
    shown: string;
    hidden: string;
};

/**
 * Open a Moodle core modal and provide a mount target for React content.
 *
 * @param {{title: string, onShown?: () => void, onHidden?: () => void}} options Modal open options.
 * @returns {Promise<{modal: MoodleModal, bodyRoot: HTMLElement}>} Modal and mount root.
 */
export const openSourceSelectorModal = async(
    options: {title: string; onShown?: () => void; onHidden?: () => void},
): Promise<{modal: MoodleModal; bodyRoot: HTMLElement}> => {
    const modalCancel = await requireAsync<ModalCancelModule>('core/modal_cancel');
    const modalEvents = await requireAsync<ModalEventsModule>('core/modal_events');
    const str = await requireAsync<StrModule>('core/str');

    // Changes are saved immediately, so the footer button only closes the modal.
    const modal = await modalCancel.create({
        title: options.title,
        body: '',
        large: true,
        removeOnClose: true,
        buttons: {cancel: await str.getString('closebuttontitle', 'core')},
    });

    const root = modal.getRoot();
    modal.setBody('<div data-local_ai_content-region="source-selector-modal-body"></div>');
    const bodyRoot = root[0].querySelector('[data-local_ai_content-region="source-selector-modal-body"]') as HTMLElement;

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
 * Close a Moodle core modal instance.
 *
 * @param {MoodleModal} modal Modal instance.
 * @returns {Promise<void>} Resolves when modal is closed.
 */
export const closeSourceSelectorModal = async(modal: MoodleModal): Promise<void> => {
    await modal.hide();
};

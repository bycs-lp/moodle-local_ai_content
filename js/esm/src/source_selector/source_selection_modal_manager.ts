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

/**
 * Open a Moodle core modal and provide a mount target for React content.
 *
 * @param {{title: string, onShown?: () => void, onHidden?: () => void}} options Modal open options.
 * @returns {Promise<{modal: MoodleModal, bodyRoot: HTMLElement} | null>} Modal and mount root when available.
 */
export const openSourceSelectorModal = async(
    options: {title: string; onShown?: () => void; onHidden?: () => void},
): Promise<{modal: MoodleModal; bodyRoot: HTMLElement} | null> => {
    const modalCancelModule = await requireAsync('core/modal_cancel') as any;
    const modalEventsModule = await requireAsync('core/modal_events') as any;
    const modalCancel = modalCancelModule?.default ?? modalCancelModule;
    const modalEvents = modalEventsModule?.default ?? modalEventsModule;

    const modal = await modalCancel.create({
        title: options.title,
        body: '',
        large: true,
        removeOnClose: true,
    }) as MoodleModal;

    const root = modal.getRoot();
    const bodyRootSelector = '[data-local_ai_content-region="source-selector-modal-body"]';
    modal.setBody('<div data-local_ai_content-region="source-selector-modal-body"></div>');

    const bodyRoot = root[0].querySelector(bodyRootSelector);
    if (!(bodyRoot instanceof HTMLElement)) {
        return null;
    }

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
 * @param {?MoodleModal} modal Modal instance.
 * @returns {Promise<void>} Resolves when modal is closed.
 */
export const closeSourceSelectorModal = async(modal: MoodleModal | null): Promise<void> => {
    if (!modal) {
        return;
    }

    await modal.hide();
};

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
 * AMD module for ragcontexts form element enhancement.
 *
 * Provides "Select all/none" functionality for section and subsection groups.
 *
 * @module    local_ai_content/ragcontexts
 * @copyright 2026 Michael Hughes
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Enhance the ragcontexts element with JavaScript functionality.
 *
 * @param {string} selector The CSS selector for the element to enhance
 */
const enhance = (selector) => {
    const container = document.querySelector(selector);
    if (!container) {
        return;
    }

    // Initialize section/subsection "select all" handlers
    initSelectAllHandlers(container);

    // Initialize checkbox change listeners for sync
    initCheckboxSync(container);
};

/**
 * Initialize "select all" checkbox handlers for sections and subsections.
 *
 * @param {HTMLElement} container The element container
 */
const initSelectAllHandlers = (container) => {
    // Handle subsection "select all" checkboxes
    container.querySelectorAll('.ragcontexts-selectall[data-group-type="subsection"]').forEach((checkbox) => {
        checkbox.addEventListener('change', (e) => {
            const subsectionId = e.target.dataset.groupId;
            const isChecked = e.target.checked;
            toggleSubsectionActivities(container, subsectionId, isChecked);
        });
    });
};

/**
 * Toggle all activities in a subsection.
 *
 * @param {HTMLElement} container The element container
 * @param {number} subsectionId The subsection ID
 * @param {boolean} isChecked Whether to select or deselect
 */
const toggleSubsectionActivities = (container, subsectionId, isChecked) => {
    // Find all checkboxes in this subsection
    const activities = container.querySelectorAll(
        `.ragcontexts-checkbox[data-subsection-id="${subsectionId}"]`
    );

    activities.forEach((checkbox) => {
        checkbox.checked = isChecked;
    });

    // Sync the "select all" checkbox state after toggle
    syncSelectAllState(container, subsectionId, 'subsection');
};

/**
 * Sync "select all" checkboxes based on individual checkbox states.
 *
 * @param {HTMLElement} container The element container
 * @param {number} id The section or subsection ID
 * @param {string} groupType The group type ('subsection')
 */
const syncSelectAllState = (container, id, groupType) => {
    // Determine selector based on group type
    const selector = groupType === 'subsection'
        ? `.ragcontexts-subsection[data-subsection-id="${id}"]`
        : `.ragcontexts-section[data-section-id="${id}"]`;

    const group = container.querySelector(selector);
    if (!group) {
        return;
    }

    // Find all checkboxes in this group
    const checkboxes = group.querySelectorAll('.ragcontexts-checkbox');
    if (checkboxes.length === 0) {
        return;
    }

    // Count checked boxes
    let checkedCount = 0;
    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            checkedCount++;
        }
    });

    // Find the "select all" checkbox for this group
    let selectAllSelector;
    if (groupType === 'subsection') {
        selectAllSelector = `.ragcontexts-subsection[data-subsection-id="${id}"] .ragcontexts-selectall`;
    } else {
        selectAllSelector = `.ragcontexts-section[data-section-id="${id}"] .ragcontexts-selectall`;
    }

    const selectAllCheckbox = container.querySelector(selectAllSelector);
    if (!selectAllCheckbox) {
        return;
    }

    // Update "select all" checkbox state
    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === checkboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
};

/**
 * Initialize checkbox change listeners to sync "select all" states.
 *
 * @param {HTMLElement} container The element container
 */
const initCheckboxSync = (container) => {
    container.addEventListener('change', (e) => {
        if (e.target.classList.contains('ragcontexts-checkbox')) {
            // Use subsection ID if available, otherwise use section ID
            const subsectionId = e.target.dataset.subsectionId || null;
            const sectionId = e.target.dataset.sectionId || null;

            if (subsectionId) {
                syncSelectAllState(container, subsectionId, 'subsection');
            } else if (sectionId) {
                // For top-level section checkboxes
                syncSelectAllState(container, sectionId, 'section');
            }
        }
    });
};

export default {
    enhance: enhance
};

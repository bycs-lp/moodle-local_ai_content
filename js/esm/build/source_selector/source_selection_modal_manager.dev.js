var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * Legacy Moodle modal manager for the source selector React component.
 *
 * @module     local_ai_content/source_selector/source_selection_modal_manager
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { requireAsync } from "@moodle/lms/core/amd";
const openSourceSelectorModal = /* @__PURE__ */ __name(async (options) => {
  const modalCancel = await requireAsync("core/modal_cancel");
  const modalEvents = await requireAsync("core/modal_events");
  const modal = await modalCancel.create({
    title: options.title,
    body: "",
    large: true,
    removeOnClose: true
  });
  const root = modal.getRoot();
  modal.setBody('<div data-local_ai_content-region="source-selector-modal-body"></div>');
  const bodyRoot = root[0].querySelector('[data-local_ai_content-region="source-selector-modal-body"]');
  if (options.onShown) {
    root.on(modalEvents.shown, options.onShown);
  }
  if (options.onHidden) {
    root.on(modalEvents.hidden, options.onHidden);
  }
  await modal.show();
  return { modal, bodyRoot };
}, "openSourceSelectorModal");
const closeSourceSelectorModal = /* @__PURE__ */ __name(async (modal) => {
  await modal.hide();
}, "closeSourceSelectorModal");
export {
  closeSourceSelectorModal,
  openSourceSelectorModal
};
//# sourceMappingURL=source_selection_modal_manager.dev.js.map

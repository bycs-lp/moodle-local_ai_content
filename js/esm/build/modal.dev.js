var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * Moodle core modals with a mount target for React content.
 *
 * @module     local_ai_content/modal
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { requireAsync } from "@moodle/lms/core/amd";
import { getString } from "@moodle/lms/core/stringUtils";
const BODY_REGION = "local_ai_content-modal-body";
const openModal = /* @__PURE__ */ __name(async (options) => {
  const withSave = options.saveLabel !== void 0;
  const modalType = await requireAsync(withSave ? "core/modal_save_cancel" : "core/modal_cancel");
  const modalEvents = await requireAsync("core/modal_events");
  const modal = await modalType.create({
    title: options.title,
    body: "",
    large: true,
    removeOnClose: true,
    buttons: withSave ? { save: options.saveLabel } : { cancel: await getString("closebuttontitle", "core") }
  });
  const root = modal.getRoot();
  modal.setBody(`<div data-region="${BODY_REGION}"></div>`);
  const bodyRoot = root[0].querySelector(`[data-region="${CSS.escape(BODY_REGION)}"]`);
  root.on(modalEvents.save, (event) => {
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
  return { modal, bodyRoot };
}, "openModal");
const closeModal = /* @__PURE__ */ __name(async (modal) => {
  await modal.hide();
}, "closeModal");
export {
  closeModal,
  openModal
};
//# sourceMappingURL=modal.dev.js.map

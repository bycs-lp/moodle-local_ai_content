var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
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
import { COMPONENT } from "./strings";
import MoodleString from "@moodle/lms/core/String";
function ContentPreview({ content, error = null }) {
  if (error !== null) {
    return /* @__PURE__ */ jsxDEV("div", { className: "alert alert-danger mb-0", role: "alert", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/content_preview.tsx",
      lineNumber: 41,
      columnNumber: 16
    }, this);
  }
  if (content === null) {
    return /* @__PURE__ */ jsxDEV("div", { className: "text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "preview_loading", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/content_preview.tsx",
      lineNumber: 45,
      columnNumber: 44
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/content_preview.tsx",
      lineNumber: 45,
      columnNumber: 16
    }, this);
  }
  if (content.trim() === "") {
    return /* @__PURE__ */ jsxDEV("div", { className: "text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "preview_empty", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/content_preview.tsx",
      lineNumber: 49,
      columnNumber: 44
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/content_preview.tsx",
      lineNumber: 49,
      columnNumber: 16
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "local_ai_content-content-preview border rounded p-2 bg-light", children: content }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/content_preview.tsx",
    lineNumber: 52,
    columnNumber: 12
  }, this);
}
__name(ContentPreview, "ContentPreview");
export {
  ContentPreview as default
};
//# sourceMappingURL=content_preview.dev.js.map

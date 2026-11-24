var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
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
import { Suspense, use } from "react";
import {
  getComponentStrings,
  getString,
  getStrings
} from "@moodle/lms/core/stringUtils";
const COMPONENT = "local_ai_content";
const CORE_STRINGS = [
  "actions",
  "add",
  "back",
  "cancel",
  "content",
  "delete",
  "description",
  "loading",
  "name",
  "required",
  "savechanges",
  "status"
];
let preloadPromise = null;
const preloadStrings = /* @__PURE__ */ __name(() => {
  preloadPromise ??= Promise.all([
    getComponentStrings(COMPONENT),
    // A failed preload is not fatal: strings missing in the cache are then fetched one by one when used.
    getStrings(CORE_STRINGS.map((key) => ({ key, component: "core" }))).catch(() => null)
  ]);
  return preloadPromise;
}, "preloadStrings");
const pluginString = /* @__PURE__ */ __name((identifier, parameters) => getString(identifier, COMPONENT, parameters), "pluginString");
function Preloaded({ children }) {
  use(preloadStrings());
  return /* @__PURE__ */ jsxDEV(Fragment, { children }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/strings.tsx",
    lineNumber: 92,
    columnNumber: 12
  }, this);
}
__name(Preloaded, "Preloaded");
function StringsProvider({ children, fallback = null }) {
  return /* @__PURE__ */ jsxDEV(Suspense, { fallback, children: /* @__PURE__ */ jsxDEV(Preloaded, { children }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/strings.tsx",
    lineNumber: 104,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/strings.tsx",
    lineNumber: 103,
    columnNumber: 9
  }, this);
}
__name(StringsProvider, "StringsProvider");
export {
  COMPONENT,
  StringsProvider,
  pluginString
};
//# sourceMappingURL=strings.dev.js.map

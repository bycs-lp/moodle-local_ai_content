var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * Data manager for the source selection of contexts.
 *
 * Single source of truth for the selected sources of a context. ES modules are singletons, so React components
 * importing this module and legacy AMD modules using the shim local_ai_content/source_selector share the same state.
 *
 * @module     local_ai_content/source_selector/data_manager
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Fetch from "@moodle/lms/core/fetch";
const loadPromises = /* @__PURE__ */ new Map();
const savePromises = /* @__PURE__ */ new Map();
const selections = /* @__PURE__ */ new Map();
const fullSelections = /* @__PURE__ */ new Map();
const listeners = /* @__PURE__ */ new Map();
const parseSourceIds = /* @__PURE__ */ __name((sourceIds) => {
  const values = typeof sourceIds === "string" ? sourceIds.split(",") : sourceIds;
  const ids = values.map((id) => Number(String(id).trim())).filter((id) => Number.isSafeInteger(id) && id > 0);
  return [...new Set(ids)];
}, "parseSourceIds");
const setSelectedSourceIds = /* @__PURE__ */ __name((contextId, sourceIds, fullSourceIds) => {
  const ids = parseSourceIds(sourceIds);
  selections.set(contextId, ids);
  fullSelections.set(contextId, fullSourceIds.filter((id) => ids.includes(id)));
  for (const listener of listeners.get(contextId) ?? []) {
    listener([...ids]);
  }
}, "setSelectedSourceIds");
const loadSourceSelection = /* @__PURE__ */ __name(async (contextId, reload = false) => {
  const cached = loadPromises.get(contextId);
  if (cached && !reload) {
    return cached;
  }
  const promise = Fetch.performGet("local_ai_content", `contexts/${contextId}/source-selections`).then(async (response) => response.json()).then((data) => {
    const item = data.items[0];
    const selection = {
      globalDocuments: item.globalDocuments,
      courseActivities: item.courseActivities,
      courseDocuments: item.courseDocuments,
      externalSources: item.externalSources,
      courseSections: item.courseSections,
      selectedSourceIds: parseSourceIds(item.selectedSourceIds),
      fullSourceIds: parseSourceIds(item.fullSourceIds),
      canSelect: item.canSelect,
      fullContentWarnChars: item.fullContentWarnChars,
      fullContentTotalWarnChars: item.fullContentTotalWarnChars
    };
    setSelectedSourceIds(contextId, selection.selectedSourceIds, selection.fullSourceIds);
    return selection;
  }).catch((error) => {
    loadPromises.delete(contextId);
    throw error;
  });
  loadPromises.set(contextId, promise);
  return promise;
}, "loadSourceSelection");
const getSelectedSourceIds = /* @__PURE__ */ __name(async (contextId) => {
  if (!selections.has(contextId)) {
    await loadSourceSelection(contextId);
  }
  return [...selections.get(contextId)];
}, "getSelectedSourceIds");
const saveSelectedSourceIds = /* @__PURE__ */ __name(async (contextId, sourceIds, fullSourceIds) => {
  const ids = parseSourceIds(sourceIds);
  const fullIds = parseSourceIds(fullSourceIds ?? fullSelections.get(contextId) ?? []).filter((id) => ids.includes(id));
  setSelectedSourceIds(contextId, ids, fullIds);
  const previous = savePromises.get(contextId) ?? Promise.resolve();
  const promise = previous.catch(() => void 0).then(async () => Fetch.performPut("local_ai_content", `contexts/${contextId}/source-selections`, {
    body: { selectedSourceIds: ids.join(","), fullSourceIds: fullIds.join(",") }
  })).then(() => {
    loadPromises.delete(contextId);
  });
  savePromises.set(contextId, promise);
  return promise;
}, "saveSelectedSourceIds");
const subscribe = /* @__PURE__ */ __name((contextId, listener) => {
  const contextListeners = listeners.get(contextId) ?? /* @__PURE__ */ new Set();
  contextListeners.add(listener);
  listeners.set(contextId, contextListeners);
  return () => {
    contextListeners.delete(listener);
    if (contextListeners.size === 0) {
      listeners.delete(contextId);
    }
  };
}, "subscribe");
export {
  getSelectedSourceIds,
  loadSourceSelection,
  parseSourceIds,
  saveSelectedSourceIds,
  subscribe
};
//# sourceMappingURL=data_manager.dev.js.map

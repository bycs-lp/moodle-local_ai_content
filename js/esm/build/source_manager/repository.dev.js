var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * REST calls and data types of the source management.
 *
 * @module     local_ai_content/source_manager/repository
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Fetch from "@moodle/lms/core/fetch";
const COMPONENT = "local_ai_content";
const request = /* @__PURE__ */ __name(async (method, path, body) => {
  const response = await Fetch.request(COMPONENT, path, { method, body });
  return response.json();
}, "request");
const getSources = /* @__PURE__ */ __name(async (contextId) => request("GET", `contexts/${contextId}/sources`), "getSources");
const setSharing = /* @__PURE__ */ __name(async (contextId, cmIds, documentIds, enabled) => request("PATCH", `contexts/${contextId}/sources`, { cmIds, documentIds, enabled }), "setSharing");
const indexSources = /* @__PURE__ */ __name(async (sourceIds) => {
  const response = await request("POST", "source-indexes", { sourceIds });
  return response.items;
}, "indexSources");
const getIndexStates = /* @__PURE__ */ __name(async (contextId) => request("GET", `contexts/${contextId}/index-states`), "getIndexStates");
const getIndexedChunks = /* @__PURE__ */ __name(async (contextId, sourceId, page) => request("GET", `contexts/${contextId}/sources/${sourceId}/indexed-chunks?page=${page}`), "getIndexedChunks");
const createDocument = /* @__PURE__ */ __name(async (contextId, scope, fields) => {
  await request("POST", `contexts/${contextId}/document-sources`, { scope, ...fields });
}, "createDocument");
const updateDocument = /* @__PURE__ */ __name(async (contextId, sourceId, fields) => request("PATCH", `contexts/${contextId}/document-sources/${sourceId}`, fields), "updateDocument");
const deleteDocument = /* @__PURE__ */ __name(async (contextId, sourceId) => request("DELETE", `contexts/${contextId}/document-sources/${sourceId}`), "deleteDocument");
export {
  createDocument,
  deleteDocument,
  getIndexStates,
  getIndexedChunks,
  getSources,
  indexSources,
  setSharing,
  updateDocument
};
//# sourceMappingURL=repository.dev.js.map

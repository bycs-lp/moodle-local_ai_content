var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
/**
 * React source management UI for course-level source configuration.
 *
 * @module     local_ai_content/source_manager
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Button, ProgressBar } from "@moodlehq/design-system";
import Fetch from "@moodle/lms/core/fetch";
import Log from "@moodle/lms/core/log";
import MoodleString from "@moodle/lms/core/String";
async function apiRequest(method, path, body) {
  const response = await Fetch.request("local_ai_content", path, { method, body });
  return response.json();
}
__name(apiRequest, "apiRequest");
function getErrorMessage(caught) {
  return caught instanceof Error ? caught.message : String(caught);
}
__name(getErrorMessage, "getErrorMessage");
function isActive(state) {
  return state.status === "queued" || state.status === "running";
}
__name(isActive, "isActive");
function formatTimestamp(timestamp) {
  if (timestamp === null) {
    return "-";
  }
  return new Date(timestamp).toLocaleString();
}
__name(formatTimestamp, "formatTimestamp");
function IndexStatusCell({ state, disabled, onIndexCurrentModel }) {
  const active = isActive(state);
  const failed = state.status === "failed";
  const badgeclass = failed ? "badge-danger" : state.status === "outdated" ? "bg-warning text-dark" : "badge-light";
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("span", { className: `badge ${badgeclass}`, children: state.statusLabel }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 151,
      columnNumber: 13
    }, this),
    active && /* @__PURE__ */ jsxDEV("div", { className: "mt-1", children: /* @__PURE__ */ jsxDEV(
      ProgressBar,
      {
        value: Math.max(2, state.percent),
        min: 0,
        max: 100,
        status: "loading",
        labelVariant: "none",
        title: state.message === "" ? state.statusLabel : state.message,
        count: `${Math.round(state.percent)}%`,
        animated: true
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 154,
        columnNumber: 21
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 153,
      columnNumber: 17
    }, this),
    failed && state.message !== "" && /* @__PURE__ */ jsxDEV("div", { className: "small text-danger mt-1", children: state.message }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 167,
      columnNumber: 17
    }, this),
    state.models.length > 0 && /* @__PURE__ */ jsxDEV("ul", { className: "list-unstyled small text-muted mt-1 mb-0", children: state.models.map((modelstate) => /* @__PURE__ */ jsxDEV("li", { children: [
      modelstate.model,
      ": ",
      modelstate.statusLabel
    ] }, modelstate.model, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 172,
      columnNumber: 25
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 170,
      columnNumber: 17
    }, this),
    state.canIndexCurrentModel && state.currentModel !== null && /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        className: "btn btn-link btn-sm p-0 mt-1",
        disabled: disabled || active,
        onClick: onIndexCurrentModel,
        children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "indexwithmymodel", component: "local_ai_content", params: state.currentModel }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 183,
          columnNumber: 21
        }, this)
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 177,
        columnNumber: 17
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 150,
    columnNumber: 9
  }, this);
}
__name(IndexStatusCell, "IndexStatusCell");
function SharingStatusCell({ state, indexingAvailable, disabled, onIndex }) {
  if (state.hasIndex) {
    return /* @__PURE__ */ jsxDEV(IndexStatusCell, { state, disabled, onIndexCurrentModel: onIndex }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 201,
      columnNumber: 16
    }, this);
  }
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("span", { className: "badge badge-light", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "sharednotsearchable", component: "local_ai_content" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 207,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 206,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mt-1", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "sharednotsearchable_desc", component: "local_ai_content" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 210,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 209,
      columnNumber: 13
    }, this),
    indexingAvailable && /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        className: "btn btn-link btn-sm p-0 mt-1",
        disabled,
        onClick: onIndex,
        children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "makesearchable", component: "local_ai_content" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 219,
          columnNumber: 21
        }, this)
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 213,
        columnNumber: 17
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 205,
    columnNumber: 9
  }, this);
}
__name(SharingStatusCell, "SharingStatusCell");
function SourceManager({ contextid }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pollIntervalMs, setPollIntervalMs] = useState(5e3);
  const [editingDocument, setEditingDocument] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [newDocumentScope, setNewDocumentScope] = useState(null);
  const [newDocument, setNewDocument] = useState({
    id: 0,
    name: "",
    description: "",
    content: ""
  });
  const plusIcon = /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-plus", "aria-hidden": "true" }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 240,
    columnNumber: 22
  }, this);
  const loggedDebugInfoReference = useRef({});
  const documentRows = useMemo(() => {
    if (!payload) {
      return [];
    }
    return [
      ...payload.items.globalDocuments.map((row) => ({ ...row, scope: "global" })),
      ...payload.items.courseDocuments.map((row) => ({ ...row, scope: "course" }))
    ].sort((a, b) => a.name.localeCompare(b.name));
  }, [payload]);
  const hasActiveTasks = useMemo(() => {
    if (!payload) {
      return false;
    }
    return [
      ...payload.items.modules,
      ...payload.items.globalDocuments,
      ...payload.items.courseDocuments
    ].some((row) => isActive(row.indexState));
  }, [payload]);
  const logDebugInfo = /* @__PURE__ */ __name((states) => {
    for (const state of states) {
      if (state.debugInfo === "" || loggedDebugInfoReference.current[state.sourceId] === state.debugInfo) {
        continue;
      }
      loggedDebugInfoReference.current[state.sourceId] = state.debugInfo;
      Log.debug(`Indexing failed for source ${state.sourceId}:
${state.debugInfo}`, "local_ai_content");
    }
  }, "logDebugInfo");
  const applyPayload = /* @__PURE__ */ __name((data) => {
    logDebugInfo([
      ...data.items.modules,
      ...data.items.globalDocuments,
      ...data.items.courseDocuments
    ].map((row) => row.indexState));
    setPayload(data);
  }, "applyPayload");
  const applyIndexStates = /* @__PURE__ */ __name((states) => {
    logDebugInfo(states);
    const byid = new Map(states.map((state) => [state.sourceId, state]));
    setPayload((current) => {
      if (!current) {
        return current;
      }
      const merge = /* @__PURE__ */ __name((row, sourceId) => {
        const state = byid.get(sourceId);
        return state ? { ...row, indexState: state } : row;
      }, "merge");
      return {
        ...current,
        items: {
          modules: current.items.modules.map((row) => merge(row, row.sourceId)),
          globalDocuments: current.items.globalDocuments.map((row) => merge(row, row.id)),
          courseDocuments: current.items.courseDocuments.map((row) => merge(row, row.id))
        }
      };
    });
  }, "applyIndexStates");
  const loadPayload = /* @__PURE__ */ __name(async () => {
    setLoading(true);
    setError(null);
    try {
      applyPayload(await apiRequest("GET", `contexts/${contextid}/sources`));
    } catch (error_) {
      setError(`Die Quellen konnten nicht geladen werden: ${getErrorMessage(error_)}`);
    } finally {
      setLoading(false);
    }
  }, "loadPayload");
  const performWrite = /* @__PURE__ */ __name(async (method, path, body) => {
    setSaving(true);
    setError(null);
    try {
      await apiRequest(method, path, body);
      applyPayload(await apiRequest("GET", `contexts/${contextid}/sources`));
      return true;
    } catch (error_) {
      setError(`Die Aktion konnte nicht ausgef\xFChrt werden: ${getErrorMessage(error_)}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, "performWrite");
  const handleIndex = /* @__PURE__ */ __name(async (sourceId) => {
    setSaving(true);
    setError(null);
    try {
      applyIndexStates([await apiRequest("POST", `sources/${sourceId}/index`)]);
    } catch (error_) {
      setError(`Die Indizierung konnte nicht gestartet werden: ${getErrorMessage(error_)}`);
    } finally {
      setSaving(false);
    }
  }, "handleIndex");
  useEffect(() => {
    void loadPayload();
  }, [contextid]);
  useEffect(() => {
    if (!hasActiveTasks) {
      return void 0;
    }
    const timer = setInterval(() => {
      void apiRequest("GET", `contexts/${contextid}/index-states`).then((data) => {
        setPollIntervalMs(data.pollIntervalSeconds * 1e3);
        applyIndexStates(data.items);
      });
    }, pollIntervalMs);
    return () => {
      clearInterval(timer);
    };
  }, [hasActiveTasks, contextid, pollIntervalMs]);
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager local-ai-content-source-manager--loading", children: "Lade Quellen..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 383,
      columnNumber: 16
    }, this);
  }
  if (!payload) {
    return /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 387,
      columnNumber: 16
    }, this);
  }
  const openCreateModal = /* @__PURE__ */ __name(() => {
    setError(null);
    setNewDocumentScope("course");
    setNewDocument({
      id: 0,
      name: "",
      description: "",
      content: ""
    });
  }, "openCreateModal");
  const closeCreateModal = /* @__PURE__ */ __name(() => {
    setNewDocumentScope(null);
  }, "closeCreateModal");
  const closeEditModal = /* @__PURE__ */ __name(() => {
    setEditingDocument(null);
  }, "closeEditModal");
  const closeDeleteModal = /* @__PURE__ */ __name(() => {
    setDocumentToDelete(null);
  }, "closeDeleteModal");
  const handleCreateDocument = /* @__PURE__ */ __name(async () => {
    if (newDocumentScope === null) {
      return;
    }
    if (newDocument.name.trim() === "") {
      setError("Bitte einen Namen f\xFCr das Dokument angeben.");
      return;
    }
    const saved = await performWrite("POST", `contexts/${contextid}/document-sources`, {
      scope: newDocumentScope,
      name: newDocument.name,
      description: newDocument.description,
      content: newDocument.content
    });
    if (saved) {
      setNewDocumentScope(null);
    }
  }, "handleCreateDocument");
  const handleUpdateDocument = /* @__PURE__ */ __name(async () => {
    if (!editingDocument) {
      return;
    }
    const saved = await performWrite("PATCH", `contexts/${contextid}/document-sources/${editingDocument.id}`, {
      name: editingDocument.name,
      description: editingDocument.description,
      content: editingDocument.content
    });
    if (saved) {
      setEditingDocument(null);
    }
  }, "handleUpdateDocument");
  const handleDeleteDocument = /* @__PURE__ */ __name(async () => {
    if (documentToDelete === null) {
      return;
    }
    const deleted = await performWrite("DELETE", `contexts/${contextid}/document-sources/${documentToDelete.id}`);
    if (deleted) {
      setDocumentToDelete(null);
    }
  }, "handleDeleteDocument");
  return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager", children: [
    !payload.indexingAvailable && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-info", role: "status", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "searchnotavailable", component: "local_ai_content" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 461,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 460,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [
        /* @__PURE__ */ jsxDEV("h5", { className: "mb-0", children: "Dokumente" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 466,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV(
          Button,
          {
            type: "button",
            variant: "primary",
            disabled: saving,
            onClick: openCreateModal,
            startIcon: plusIcon,
            label: "Dokument anlegen"
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 467,
            columnNumber: 21
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 465,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-striped", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Name" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 479,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Beschreibung" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 480,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Geltungsbereich" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 481,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI freigegeben" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 482,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 483,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 484,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Aktionen" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 485,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 478,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 477,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          documentRows.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 491,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.description === "" ? "-" : row.description }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 492,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.scope === "global" ? /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-globe", "aria-label": "Globale Quelle", title: "Globale Quelle" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 496,
              columnNumber: 45
            }, this) : /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-graduation-cap", "aria-label": "Kursquelle", title: "Kursquelle" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 499,
              columnNumber: 45
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 493,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
              "input",
              {
                id: `document-enabled-${row.id}`,
                className: "form-check-input",
                type: "checkbox",
                role: "switch",
                checked: row.enabled,
                disabled: saving || !row.canEdit,
                onChange: () => {
                  void performWrite(
                    "PATCH",
                    `contexts/${contextid}/document-sources/${row.id}`,
                    { enabled: !row.enabled }
                  );
                },
                "aria-label": `Dokument ${row.name} f\xFCr KI freigeben`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 504,
                columnNumber: 41
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 503,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 502,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && /* @__PURE__ */ jsxDEV(
              SharingStatusCell,
              {
                state: row.indexState,
                indexingAvailable: payload.indexingAvailable,
                disabled: saving || !row.canEdit,
                onIndex: () => {
                  void handleIndex(row.id);
                }
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 523,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 522,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && row.indexState.hasIndex && formatTimestamp(row.indexState.lastIndexedAt) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 532,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.canEdit && /* @__PURE__ */ jsxDEV("div", { className: "d-flex gap-1", children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "btn btn-link p-0",
                  disabled: saving,
                  onClick: () => {
                    setEditingDocument({
                      id: row.id,
                      name: row.name,
                      description: row.description,
                      content: row.content
                    });
                  },
                  "aria-label": `Dokument ${row.name} bearbeiten`,
                  title: "Bearbeiten",
                  children: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-pencil", "aria-hidden": "true" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 551,
                    columnNumber: 49
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 536,
                  columnNumber: 45
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "btn btn-link text-danger p-0",
                  disabled: saving,
                  onClick: () => {
                    setDocumentToDelete(row);
                  },
                  "aria-label": `Dokument ${row.name} l\xF6schen`,
                  title: "L\xF6schen",
                  children: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-trash", "aria-hidden": "true" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 563,
                    columnNumber: 49
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 553,
                  columnNumber: 45
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 535,
              columnNumber: 41
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 533,
              columnNumber: 33
            }, this)
          ] }, row.id, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 490,
            columnNumber: 29
          }, this)),
          documentRows.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 7, className: "text-muted", children: "Keine Dokumente vorhanden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 572,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 571,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 488,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 476,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 464,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("h5", { children: "Aktivit\xE4ten dieses Kurses" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 580,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-hover", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Aktivit\xE4t" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 584,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Typ" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 585,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI freigegeben" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 586,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 587,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 588,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 583,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 582,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          payload.items.modules.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 594,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.modDisplayName === "" ? row.modName : row.modDisplayName }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 595,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
              "input",
              {
                id: `module-enabled-${row.cmId}`,
                className: "form-check-input",
                type: "checkbox",
                role: "switch",
                checked: row.enabled,
                disabled: saving,
                onChange: () => {
                  void performWrite(
                    "PATCH",
                    `contexts/${contextid}/module-sources/${row.cmId}`,
                    { enabled: !row.enabled }
                  );
                },
                "aria-label": `Aktivit\xE4t ${row.name} f\xFCr KI freigeben`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 598,
                columnNumber: 41
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 597,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 596,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && /* @__PURE__ */ jsxDEV(
              SharingStatusCell,
              {
                state: row.indexState,
                indexingAvailable: payload.indexingAvailable,
                disabled: saving,
                onIndex: () => {
                  void handleIndex(row.sourceId);
                }
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 617,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 616,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && row.indexState.hasIndex && formatTimestamp(row.indexState.lastIndexedAt) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 626,
              columnNumber: 33
            }, this)
          ] }, row.cmId, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 593,
            columnNumber: 29
          }, this)),
          payload.items.modules.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 5, className: "text-muted", children: "Keine unterst\xFCtzten Aktivit\xE4ten gefunden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 631,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 630,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 591,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 581,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted", children: "Hier werden nur Aktivit\xE4ten angezeigt, deren Typ aktuell vom Plugin unterst\xFCtzt wird." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 636,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 579,
      columnNumber: 13
    }, this),
    newDocumentScope !== null && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "modal fade show d-block",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "source-create-modal-title",
          children: /* @__PURE__ */ jsxDEV("div", { className: "modal-dialog modal-lg modal-dialog-scrollable", role: "document", children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
              /* @__PURE__ */ jsxDEV("h5", { id: "source-create-modal-title", className: "modal-title", children: "Neues Dokument anlegen" }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 652,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "close",
                  "aria-label": "Close",
                  onClick: closeCreateModal,
                  disabled: saving,
                  children: /* @__PURE__ */ jsxDEV("span", { "aria-hidden": "true", children: "\xD7" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 660,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 653,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 651,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              payload.canManageGlobalSources && /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { htmlFor: "source-create-scope", children: "Quelle anlegen in" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 666,
                  columnNumber: 45
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "select",
                  {
                    id: "source-create-scope",
                    className: "custom-select",
                    value: newDocumentScope,
                    onChange: (event) => {
                      setNewDocumentScope(event.target.value === "global" ? "global" : "course");
                    },
                    children: [
                      /* @__PURE__ */ jsxDEV("option", { value: "course", children: "Diesem Kurs" }, void 0, false, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 675,
                        columnNumber: 49
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "global", children: "Systemkontext (global)" }, void 0, false, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 676,
                        columnNumber: 49
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 667,
                    columnNumber: 45
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 665,
                columnNumber: 41
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 681,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    className: "form-control form-control-sm",
                    value: newDocument.name,
                    onChange: (event) => {
                      setNewDocument({ ...newDocument, name: event.target.value });
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 682,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 680,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 691,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    className: "form-control form-control-sm",
                    value: newDocument.description,
                    onChange: (event) => {
                      setNewDocument({ ...newDocument, description: event.target.value });
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 692,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 690,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 701,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "textarea",
                  {
                    className: "form-control form-control-sm",
                    rows: 8,
                    value: newDocument.content,
                    onChange: (event) => {
                      setNewDocument({ ...newDocument, content: event.target.value });
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 702,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 700,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 663,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-footer", children: [
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "secondary",
                  disabled: saving,
                  onClick: closeCreateModal,
                  label: "Abbrechen"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 713,
                  columnNumber: 37
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "primary",
                  disabled: saving,
                  onClick: handleCreateDocument,
                  label: "Dokument anlegen"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 720,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 712,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 650,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 649,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 643,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeCreateModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 731,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 642,
      columnNumber: 17
    }, this),
    editingDocument && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "modal fade show d-block",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "source-edit-modal-title",
          children: /* @__PURE__ */ jsxDEV("div", { className: "modal-dialog modal-lg modal-dialog-scrollable", role: "document", children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
              /* @__PURE__ */ jsxDEV("h5", { id: "source-edit-modal-title", className: "modal-title", children: "Dokument bearbeiten" }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 746,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "close",
                  "aria-label": "Close",
                  onClick: closeEditModal,
                  disabled: saving,
                  children: /* @__PURE__ */ jsxDEV("span", { "aria-hidden": "true", children: "\xD7" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 754,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 747,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 745,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 759,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    className: "form-control form-control-sm",
                    value: editingDocument.name,
                    onChange: (event) => {
                      setEditingDocument({ ...editingDocument, name: event.target.value });
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 760,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 758,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 769,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    className: "form-control form-control-sm",
                    value: editingDocument.description,
                    onChange: (event) => {
                      setEditingDocument({ ...editingDocument, description: event.target.value });
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 770,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 768,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 779,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "textarea",
                  {
                    className: "form-control form-control-sm",
                    rows: 8,
                    value: editingDocument.content,
                    onChange: (event) => {
                      setEditingDocument({ ...editingDocument, content: event.target.value });
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 780,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 778,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 757,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-footer", children: [
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "secondary",
                  disabled: saving,
                  onClick: closeEditModal,
                  label: "Abbrechen"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 791,
                  columnNumber: 37
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "primary",
                  disabled: saving,
                  onClick: handleUpdateDocument,
                  label: "Speichern"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 798,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 790,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 744,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 743,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 737,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeEditModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 809,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 736,
      columnNumber: 17
    }, this),
    documentToDelete !== null && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "modal fade show d-block",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "source-delete-modal-title",
          children: /* @__PURE__ */ jsxDEV("div", { className: "modal-dialog", role: "document", children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
              /* @__PURE__ */ jsxDEV("h5", { id: "source-delete-modal-title", className: "modal-title", children: "Quelle l\xF6schen" }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 824,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "close",
                  "aria-label": "Close",
                  onClick: closeDeleteModal,
                  disabled: saving,
                  children: /* @__PURE__ */ jsxDEV("span", { "aria-hidden": "true", children: "\xD7" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 832,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 825,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 823,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              "M\xF6chtest du die Quelle \u201E",
              documentToDelete.name,
              "\u201C wirklich l\xF6schen?"
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 835,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-footer", children: [
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "secondary",
                  disabled: saving,
                  onClick: closeDeleteModal,
                  label: "Abbrechen"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 839,
                  columnNumber: 37
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "danger",
                  disabled: saving,
                  onClick: handleDeleteDocument,
                  label: "L\xF6schen"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 846,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 838,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 822,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 821,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 815,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeDeleteModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 857,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 814,
      columnNumber: 17
    }, this),
    error !== null && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 861,
      columnNumber: 32
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 458,
    columnNumber: 9
  }, this);
}
__name(SourceManager, "SourceManager");
export {
  SourceManager as default
};
//# sourceMappingURL=source_manager.dev.js.map

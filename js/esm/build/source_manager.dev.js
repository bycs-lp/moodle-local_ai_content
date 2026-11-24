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
  use,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Badge,
  Button,
  CloseButton,
  ProgressBar,
  Switch
} from "@moodlehq/design-system";
import { pluginString, StringsProvider } from "./strings";
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
function IndexStatusCell({ state, indexingAvailable, disabled, onIndexCurrentModel }) {
  const active = isActive(state);
  const failed = state.status === "failed";
  const badgevariant = failed ? "danger" : state.status === "outdated" ? "warning" : "secondary";
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(Badge, { variant: badgevariant, subtle: badgevariant === "secondary", label: state.statusLabel }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 162,
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
        lineNumber: 165,
        columnNumber: 21
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 164,
      columnNumber: 17
    }, this),
    failed && state.message !== "" && /* @__PURE__ */ jsxDEV("div", { className: "small text-danger mt-1", children: state.message }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 178,
      columnNumber: 17
    }, this),
    state.models.length > 0 && /* @__PURE__ */ jsxDEV("ul", { className: "list-unstyled small text-muted mt-1 mb-0", children: state.models.map((modelstate) => /* @__PURE__ */ jsxDEV("li", { children: [
      modelstate.model,
      ": ",
      modelstate.statusLabel
    ] }, modelstate.model, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 183,
      columnNumber: 25
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 181,
      columnNumber: 17
    }, this),
    indexingAvailable && state.canIndexCurrentModel && state.currentModel !== null && /* @__PURE__ */ jsxDEV(
      Button,
      {
        variant: "ghost",
        size: "sm",
        className: "mt-1",
        label: use(pluginString("indexwithmymodel", state.currentModel)),
        disabled: disabled || active,
        onClick: onIndexCurrentModel
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 188,
        columnNumber: 17
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 161,
    columnNumber: 9
  }, this);
}
__name(IndexStatusCell, "IndexStatusCell");
function SharingStatusCell({ state, indexingAvailable, disabled, onIndex }) {
  if (state.hasIndex) {
    return /* @__PURE__ */ jsxDEV(
      IndexStatusCell,
      {
        state,
        indexingAvailable,
        disabled,
        onIndexCurrentModel: onIndex
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 212,
        columnNumber: 16
      },
      this
    );
  }
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(Badge, { variant: "secondary", subtle: true, label: use(pluginString("sharednotsearchable")) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 218,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mt-1", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "sharednotsearchable_desc", component: "local_ai_content" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 220,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 219,
      columnNumber: 13
    }, this),
    indexingAvailable && /* @__PURE__ */ jsxDEV(
      Button,
      {
        variant: "ghost",
        size: "sm",
        className: "mt-1",
        label: use(pluginString("makesearchable")),
        disabled,
        onClick: onIndex
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 223,
        columnNumber: 17
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 217,
    columnNumber: 9
  }, this);
}
__name(SharingStatusCell, "SharingStatusCell");
function SourceManager(props) {
  return /* @__PURE__ */ jsxDEV(StringsProvider, { children: /* @__PURE__ */ jsxDEV(SourceManagerContent, { ...props }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 239,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 238,
    columnNumber: 9
  }, this);
}
__name(SourceManager, "SourceManager");
function SourceManagerContent({ contextid }) {
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
    lineNumber: 258,
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
      lineNumber: 401,
      columnNumber: 16
    }, this);
  }
  if (!payload) {
    return /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 405,
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
    payload.indexingUnavailableReason === "novecstore" && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-info", role: "status", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "indexingnotavailable_novecstore", component: "local_ai_content" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 479,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 478,
      columnNumber: 17
    }, this),
    payload.indexingUnavailableReason === "noembedding" && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-info", role: "status", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "searchnotavailable", component: "local_ai_content" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 484,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 483,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [
        /* @__PURE__ */ jsxDEV("h5", { className: "mb-0", children: "Dokumente" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 489,
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
            lineNumber: 490,
            columnNumber: 21
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 488,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-striped", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Name" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 502,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Beschreibung" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 503,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Geltungsbereich" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 504,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI freigegeben" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 505,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 506,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 507,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Aktionen" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 508,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 501,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 500,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          documentRows.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 514,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.description === "" ? "-" : row.description }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 515,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.scope === "global" ? /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-globe", "aria-label": "Globale Quelle", title: "Globale Quelle" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 519,
              columnNumber: 45
            }, this) : /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-graduation-cap", "aria-label": "Kursquelle", title: "Kursquelle" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 522,
              columnNumber: 45
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 516,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(
              Switch,
              {
                id: `document-enabled-${row.id}`,
                checked: row.enabled,
                disabled: saving || !row.canEdit,
                onChange: () => {
                  void performWrite(
                    "PATCH",
                    `contexts/${contextid}/document-sources/${row.id}`,
                    { enabled: !row.enabled }
                  );
                },
                hideLabel: true,
                label: `Dokument ${row.name} f\xFCr KI freigeben`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 526,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 525,
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
                lineNumber: 542,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 541,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && row.indexState.hasIndex && formatTimestamp(row.indexState.lastIndexedAt) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 551,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.canEdit && /* @__PURE__ */ jsxDEV("div", { className: "d-flex gap-1", children: [
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
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
                  startIcon: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-pencil m-0", "aria-hidden": "true" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 569,
                    columnNumber: 60
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 555,
                  columnNumber: 45
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "text-danger",
                  disabled: saving,
                  onClick: () => {
                    setDocumentToDelete(row);
                  },
                  "aria-label": `Dokument ${row.name} l\xF6schen`,
                  title: "L\xF6schen",
                  startIcon: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-trash m-0", "aria-hidden": "true" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 581,
                    columnNumber: 60
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 571,
                  columnNumber: 45
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 554,
              columnNumber: 41
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 552,
              columnNumber: 33
            }, this)
          ] }, row.id, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 513,
            columnNumber: 29
          }, this)),
          documentRows.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 7, className: "text-muted", children: "Keine Dokumente vorhanden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 590,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 589,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 511,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 499,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 487,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("h5", { children: "Aktivit\xE4ten dieses Kurses" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 598,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-hover", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Aktivit\xE4t" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 602,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Typ" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 603,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI freigegeben" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 604,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 605,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 606,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 601,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 600,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          payload.items.modules.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 612,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.modDisplayName === "" ? row.modName : row.modDisplayName }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 613,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(
              Switch,
              {
                id: `module-enabled-${row.cmId}`,
                checked: row.enabled,
                disabled: saving,
                onChange: () => {
                  void performWrite(
                    "PATCH",
                    `contexts/${contextid}/module-sources/${row.cmId}`,
                    { enabled: !row.enabled }
                  );
                },
                hideLabel: true,
                label: `Aktivit\xE4t ${row.name} f\xFCr KI freigeben`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 615,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 614,
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
                lineNumber: 631,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 630,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && row.indexState.hasIndex && formatTimestamp(row.indexState.lastIndexedAt) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 640,
              columnNumber: 33
            }, this)
          ] }, row.cmId, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 611,
            columnNumber: 29
          }, this)),
          payload.items.modules.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 5, className: "text-muted", children: "Keine unterst\xFCtzten Aktivit\xE4ten gefunden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 645,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 644,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 609,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 599,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted", children: "Hier werden nur Aktivit\xE4ten angezeigt, deren Typ aktuell vom Plugin unterst\xFCtzt wird." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 650,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 597,
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
                lineNumber: 666,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV(CloseButton, { "aria-label": "Close", onClick: closeCreateModal, disabled: saving }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 667,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 665,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              payload.canManageGlobalSources && /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { htmlFor: "source-create-scope", children: "Quelle anlegen in" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 672,
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
                        lineNumber: 681,
                        columnNumber: 49
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "global", children: "Systemkontext (global)" }, void 0, false, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 682,
                        columnNumber: 49
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 673,
                    columnNumber: 45
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 671,
                columnNumber: 41
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 687,
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
                    lineNumber: 688,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 686,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 697,
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
                    lineNumber: 698,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 696,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 707,
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
                    lineNumber: 708,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 706,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 669,
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
                  lineNumber: 719,
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
                  lineNumber: 726,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 718,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 664,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 663,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 657,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeCreateModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 737,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 656,
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
                lineNumber: 752,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV(CloseButton, { "aria-label": "Close", onClick: closeEditModal, disabled: saving }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 753,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 751,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 757,
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
                    lineNumber: 758,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 756,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 767,
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
                    lineNumber: 768,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 766,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 777,
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
                    lineNumber: 778,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 776,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 755,
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
                  lineNumber: 789,
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
                  lineNumber: 796,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 788,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 750,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 749,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 743,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeEditModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 807,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 742,
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
                lineNumber: 822,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV(CloseButton, { "aria-label": "Close", onClick: closeDeleteModal, disabled: saving }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 823,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 821,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              "M\xF6chtest du die Quelle \u201E",
              documentToDelete.name,
              "\u201C wirklich l\xF6schen?"
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 825,
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
                  lineNumber: 829,
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
                  lineNumber: 836,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 828,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 820,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 819,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 813,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeDeleteModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 847,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 812,
      columnNumber: 17
    }, this),
    error !== null && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 851,
      columnNumber: 32
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 476,
    columnNumber: 9
  }, this);
}
__name(SourceManagerContent, "SourceManagerContent");
export {
  SourceManager as default
};
//# sourceMappingURL=source_manager.dev.js.map

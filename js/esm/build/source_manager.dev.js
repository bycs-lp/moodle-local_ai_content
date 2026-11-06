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
import { useEffect, useMemo, useRef, useState } from "react";
import Config from "@moodle/lms/core/config";
import Log from "@moodle/lms/core/log";
import MoodleString from "@moodle/lms/core/String";
import { Button, ProgressBar } from "@moodlehq/design-system";
function buildApiUrl(path) {
  const url = new URL(Config.apibase);
  const basepathname = url.pathname.replace(/\/+$/, "");
  url.pathname = `${basepathname}/rest/v2/local_ai_content/${path.replace(/^\/+/, "")}`.replace(/\/{2,}/g, "/");
  return url.toString();
}
__name(buildApiUrl, "buildApiUrl");
async function apiRequest(method, path, body) {
  const response = await fetch(buildApiUrl(path), {
    method,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pageparent": Config.traceId || ""
    },
    body: body ? JSON.stringify(body) : void 0,
    credentials: "same-origin"
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message ?? `HTTP ${response.status}`);
  }
  return payload;
}
__name(apiRequest, "apiRequest");
function isActive(state) {
  return state.status === "queued" || state.status === "running";
}
__name(isActive, "isActive");
function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "-";
  }
  return new Date(timestamp).toLocaleString();
}
__name(formatTimestamp, "formatTimestamp");
function IndexStatusCell({ state, disabled, onIndexCurrentModel }) {
  const active = isActive(state);
  const failed = state.status === "failed";
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("span", { className: `badge ${failed ? "badge-danger" : "badge-light"}`, children: state.statusLabel }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 161,
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
        title: state.message || state.statusLabel,
        count: `${Math.round(state.percent)}%`,
        animated: true
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 164,
        columnNumber: 21
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 163,
      columnNumber: 17
    }, this),
    failed && state.message && /* @__PURE__ */ jsxDEV("div", { className: "small text-danger mt-1", children: state.message }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 177,
      columnNumber: 17
    }, this),
    state.models.length > 0 && /* @__PURE__ */ jsxDEV("ul", { className: "list-unstyled small text-muted mt-1 mb-0", children: state.models.map((modelstate) => /* @__PURE__ */ jsxDEV("li", { children: [
      modelstate.model,
      ": ",
      modelstate.statusLabel
    ] }, modelstate.model, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 182,
      columnNumber: 25
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 180,
      columnNumber: 17
    }, this),
    state.canIndexCurrentModel && state.currentModel && /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        className: "btn btn-link btn-sm p-0 mt-1",
        disabled: disabled || active,
        onClick: onIndexCurrentModel,
        children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "indexwithmymodel", component: "local_ai_content", params: state.currentModel }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 193,
          columnNumber: 21
        }, this)
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 187,
        columnNumber: 17
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 160,
    columnNumber: 9
  }, this);
}
__name(IndexStatusCell, "IndexStatusCell");
function SourceManager({ contextid }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pollIntervalMs, setPollIntervalMs] = useState(5e3);
  const [editingDocument, setEditingDocument] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [createScope, setCreateScope] = useState(null);
  const [newDocument, setNewDocument] = useState({ id: 0, name: "", description: "", content: "" });
  const plusIcon = /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-plus", "aria-hidden": "true" }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 212,
    columnNumber: 22
  }, this);
  const loggedDebugInfoRef = useRef({});
  const documentRows = useMemo(() => {
    if (!payload) {
      return [];
    }
    return [
      ...payload.items.globaldocuments.map((row) => ({ ...row, scope: "global" })),
      ...payload.items.coursedocuments.map((row) => ({ ...row, scope: "course" }))
    ].sort((a, b) => a.name.localeCompare(b.name));
  }, [payload]);
  const hasActiveTasks = useMemo(() => {
    if (!payload) {
      return false;
    }
    return [
      ...payload.items.modules,
      ...payload.items.globaldocuments,
      ...payload.items.coursedocuments
    ].some((row) => isActive(row.indexState));
  }, [payload]);
  const logDebugInfo = /* @__PURE__ */ __name((states) => {
    states.forEach((state) => {
      if (state.debugInfo && loggedDebugInfoRef.current[state.sourceId] !== state.debugInfo) {
        loggedDebugInfoRef.current[state.sourceId] = state.debugInfo;
        Log.debug(`Indexing failed for source ${state.sourceId}:
${state.debugInfo}`, "local_ai_content");
      }
    });
  }, "logDebugInfo");
  const applyPayload = /* @__PURE__ */ __name((data) => {
    logDebugInfo([
      ...data.items.modules,
      ...data.items.globaldocuments,
      ...data.items.coursedocuments
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
      const merge = /* @__PURE__ */ __name((row, sourceid) => {
        const state = byid.get(sourceid);
        return state ? { ...row, indexState: state } : row;
      }, "merge");
      return {
        ...current,
        items: {
          modules: current.items.modules.map((row) => merge(row, row.sourceid)),
          globaldocuments: current.items.globaldocuments.map((row) => merge(row, row.id)),
          coursedocuments: current.items.coursedocuments.map((row) => merge(row, row.id))
        }
      };
    });
  }, "applyIndexStates");
  const loadPayload = /* @__PURE__ */ __name(async () => {
    setLoading(true);
    setError(null);
    try {
      applyPayload(await apiRequest("GET", `contexts/${contextid}/sources`));
    } catch (caught) {
      setError(`Die Quellen konnten nicht geladen werden: ${caught.message}`);
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
    } catch (caught) {
      setError(`Die Aktion konnte nicht ausgef\xFChrt werden: ${caught.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, "performWrite");
  const handleAllowIndexToggle = /* @__PURE__ */ __name(async (sourceid, allowIndex) => {
    setSaving(true);
    setError(null);
    try {
      applyIndexStates([await apiRequest("PUT", `sources/${sourceid}/index-state`, { allowIndex })]);
    } catch (caught) {
      setError(`Der Indizierungsstatus konnte nicht ge\xE4ndert werden: ${caught.message}`);
    } finally {
      setSaving(false);
    }
  }, "handleAllowIndexToggle");
  useEffect(() => {
    void loadPayload();
  }, [contextid]);
  useEffect(() => {
    if (!hasActiveTasks) {
      return void 0;
    }
    const timer = window.setInterval(async () => {
      const data = await apiRequest("GET", `contexts/${contextid}/index-states`);
      setPollIntervalMs(data.pollIntervalSeconds * 1e3);
      applyIndexStates(data.items);
    }, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [hasActiveTasks, contextid, pollIntervalMs]);
  const openCreateModal = /* @__PURE__ */ __name(() => {
    setError(null);
    setCreateScope("course");
    setNewDocument({ id: 0, name: "", description: "", content: "" });
  }, "openCreateModal");
  const closeCreateModal = /* @__PURE__ */ __name(() => {
    setCreateScope(null);
  }, "closeCreateModal");
  const handleCreateDocument = /* @__PURE__ */ __name(async () => {
    if (!createScope) {
      return;
    }
    if (!newDocument.name.trim()) {
      setError("Bitte einen Namen f\xFCr das Dokument angeben.");
      return;
    }
    const saved = await performWrite("POST", `contexts/${contextid}/document-sources`, {
      scope: createScope,
      name: newDocument.name,
      description: newDocument.description,
      content: newDocument.content
    });
    if (saved) {
      setCreateScope(null);
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
    if (!deleteCandidate) {
      return;
    }
    const deleted = await performWrite("DELETE", `contexts/${contextid}/document-sources/${deleteCandidate.id}`);
    if (deleted) {
      setDeleteCandidate(null);
    }
  }, "handleDeleteDocument");
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager local-ai-content-source-manager--loading", children: "Lade Quellen..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 398,
      columnNumber: 16
    }, this);
  }
  if (!payload) {
    return /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 402,
      columnNumber: 16
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager", children: [
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [
        /* @__PURE__ */ jsxDEV("h5", { className: "mb-0", children: "Dokumente" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 409,
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
            lineNumber: 410,
            columnNumber: 21
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 408,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-striped", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Name" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 422,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Beschreibung" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 423,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Geltungsbereich" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 424,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI-Zugriff aktiv" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 425,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "In Vektorstore indizieren" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 426,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 427,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 428,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Aktionen" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 429,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 421,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 420,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          documentRows.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 435,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.description || "-" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 436,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.scope === "global" ? /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-globe", "aria-label": "Globale Quelle", title: "Globale Quelle" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 439,
              columnNumber: 37
            }, this) : /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-graduation-cap", "aria-label": "Kursquelle", title: "Kursquelle" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 441,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 437,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
              "input",
              {
                id: `document-enabled-${row.id}`,
                className: "form-check-input",
                type: "checkbox",
                role: "switch",
                checked: row.enabled,
                disabled: saving || !row.canedit,
                onChange: () => performWrite(
                  "PATCH",
                  `contexts/${contextid}/document-sources/${row.id}`,
                  { enabled: !row.enabled }
                ),
                "aria-label": `Dokument ${row.name} f\xFCr KI-Zugriff aktivieren`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 446,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 445,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 444,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
              "input",
              {
                id: `document-index-${row.id}`,
                className: "form-check-input",
                type: "checkbox",
                role: "switch",
                checked: row.indexState.allowIndex,
                disabled: saving || !row.canedit || isActive(row.indexState),
                onChange: () => handleAllowIndexToggle(row.id, !row.indexState.allowIndex),
                "aria-label": `Dokument ${row.name} in Vektorstore indizieren`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 465,
                columnNumber: 41
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 464,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 462,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && /* @__PURE__ */ jsxDEV(
              IndexStatusCell,
              {
                state: row.indexState,
                disabled: saving || !row.canedit,
                onIndexCurrentModel: () => handleAllowIndexToggle(row.id, true)
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 479,
                columnNumber: 33
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 478,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && formatTimestamp(row.indexState.lastIndexedAt) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 485,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.canedit && /* @__PURE__ */ jsxDEV("div", { className: "d-flex gap-1", children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "btn btn-link p-0",
                  disabled: saving,
                  onClick: () => setEditingDocument({
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    content: row.content
                  }),
                  "aria-label": `Dokument ${row.name} bearbeiten`,
                  title: "Bearbeiten",
                  children: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-pencil", "aria-hidden": "true" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 502,
                    columnNumber: 45
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 489,
                  columnNumber: 41
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "btn btn-link text-danger p-0",
                  disabled: saving,
                  onClick: () => setDeleteCandidate(row),
                  "aria-label": `Dokument ${row.name} l\xF6schen`,
                  title: "L\xF6schen",
                  children: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-trash", "aria-hidden": "true" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 512,
                    columnNumber: 45
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 504,
                  columnNumber: 41
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 488,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 486,
              columnNumber: 29
            }, this)
          ] }, row.id, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 434,
            columnNumber: 25
          }, this)),
          documentRows.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 8, className: "text-muted", children: "Keine Dokumente vorhanden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 521,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 520,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 432,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 419,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 407,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("h5", { children: "Aktivit\xE4ten dieses Kurses" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 529,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-hover", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Aktivit\xE4t" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 533,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Typ" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 534,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI-Zugriff aktiv" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 535,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "In Vektorstore indizieren" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 536,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 537,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 538,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 532,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 531,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          payload.items.modules.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 544,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.moddisplayname || row.modname }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 545,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
              "input",
              {
                id: `module-enabled-${row.cmid}`,
                className: "form-check-input",
                type: "checkbox",
                role: "switch",
                checked: row.enabled,
                disabled: saving,
                onChange: () => performWrite(
                  "PATCH",
                  `contexts/${contextid}/module-sources/${row.cmid}`,
                  { enabled: !row.enabled }
                ),
                "aria-label": `Aktivit\xE4t ${row.name} f\xFCr KI-Zugriff aktivieren`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 548,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 547,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 546,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
              "input",
              {
                id: `module-index-${row.cmid}`,
                className: "form-check-input",
                type: "checkbox",
                role: "switch",
                checked: row.indexState.allowIndex,
                disabled: saving || isActive(row.indexState),
                onChange: () => handleAllowIndexToggle(row.sourceid, !row.indexState.allowIndex),
                "aria-label": `Aktivit\xE4t ${row.name} in Vektorstore indizieren`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 567,
                columnNumber: 41
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 566,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 564,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && /* @__PURE__ */ jsxDEV(
              IndexStatusCell,
              {
                state: row.indexState,
                disabled: saving,
                onIndexCurrentModel: () => handleAllowIndexToggle(row.sourceid, true)
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 581,
                columnNumber: 33
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 580,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.enabled && formatTimestamp(row.indexState.lastIndexedAt) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 587,
              columnNumber: 29
            }, this)
          ] }, row.cmid, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 543,
            columnNumber: 25
          }, this)),
          payload.items.modules.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 6, className: "text-muted", children: "Keine unterst\xFCtzten Aktivit\xE4ten gefunden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 592,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 591,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 541,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 530,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted", children: "Hier werden nur Aktivit\xE4ten angezeigt, deren Typ aktuell vom Plugin unterst\xFCtzt wird." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 597,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 528,
      columnNumber: 13
    }, this),
    createScope !== null && /* @__PURE__ */ jsxDEV(Fragment, { children: [
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
                lineNumber: 613,
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
                    lineNumber: 621,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 614,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 612,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              payload.canmanagesystemsources && /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { htmlFor: "source-create-scope", children: "Quelle anlegen in" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 627,
                  columnNumber: 45
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "select",
                  {
                    id: "source-create-scope",
                    className: "custom-select",
                    value: createScope,
                    onChange: (e) => setCreateScope(e.target.value === "global" ? "global" : "course"),
                    children: [
                      /* @__PURE__ */ jsxDEV("option", { value: "course", children: "Diesem Kurs" }, void 0, false, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 634,
                        columnNumber: 49
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "global", children: "Systemkontext (global)" }, void 0, false, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 635,
                        columnNumber: 49
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 628,
                    columnNumber: 45
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 626,
                columnNumber: 41
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 640,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    className: "form-control form-control-sm",
                    value: newDocument.name,
                    onChange: (e) => setNewDocument({ ...newDocument, name: e.target.value })
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 641,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 639,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 648,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    className: "form-control form-control-sm",
                    value: newDocument.description,
                    onChange: (e) => setNewDocument({ ...newDocument, description: e.target.value })
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 649,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 647,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 656,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "textarea",
                  {
                    className: "form-control form-control-sm",
                    rows: 8,
                    value: newDocument.content,
                    onChange: (e) => setNewDocument({ ...newDocument, content: e.target.value })
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 657,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 655,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 624,
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
                  lineNumber: 666,
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
                  lineNumber: 673,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 665,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 611,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 610,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 604,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeCreateModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 684,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 603,
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
                lineNumber: 699,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "close",
                  "aria-label": "Close",
                  onClick: () => setEditingDocument(null),
                  disabled: saving,
                  children: /* @__PURE__ */ jsxDEV("span", { "aria-hidden": "true", children: "\xD7" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 707,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 700,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 698,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 712,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    className: "form-control form-control-sm",
                    value: editingDocument.name,
                    onChange: (e) => setEditingDocument({ ...editingDocument, name: e.target.value })
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 713,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 711,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 720,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    className: "form-control form-control-sm",
                    value: editingDocument.description,
                    onChange: (e) => setEditingDocument({ ...editingDocument, description: e.target.value })
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 721,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 719,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 728,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "textarea",
                  {
                    className: "form-control form-control-sm",
                    rows: 8,
                    value: editingDocument.content,
                    onChange: (e) => setEditingDocument({ ...editingDocument, content: e.target.value })
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 729,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 727,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 710,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-footer", children: [
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "secondary",
                  disabled: saving,
                  onClick: () => setEditingDocument(null),
                  label: "Abbrechen"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 738,
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
                  lineNumber: 745,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 737,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 697,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 696,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 690,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: () => setEditingDocument(null) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 756,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 689,
      columnNumber: 17
    }, this),
    deleteCandidate && /* @__PURE__ */ jsxDEV(Fragment, { children: [
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
                lineNumber: 771,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "close",
                  "aria-label": "Close",
                  onClick: () => setDeleteCandidate(null),
                  disabled: saving,
                  children: /* @__PURE__ */ jsxDEV("span", { "aria-hidden": "true", children: "\xD7" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 779,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 772,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 770,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              "M\xF6chtest du die Quelle \u201E",
              deleteCandidate.name,
              "\u201C wirklich l\xF6schen?"
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 782,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-footer", children: [
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "secondary",
                  disabled: saving,
                  onClick: () => setDeleteCandidate(null),
                  label: "Abbrechen"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 786,
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
                  lineNumber: 793,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 785,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 769,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 768,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 762,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: () => setDeleteCandidate(null) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 804,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 761,
      columnNumber: 17
    }, this),
    error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 808,
      columnNumber: 23
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 406,
    columnNumber: 9
  }, this);
}
__name(SourceManager, "SourceManager");
export {
  SourceManager as default
};
//# sourceMappingURL=source_manager.dev.js.map

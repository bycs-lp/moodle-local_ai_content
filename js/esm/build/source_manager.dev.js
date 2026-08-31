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
function IndexStatusCell({ state }) {
  const active = isActive(state);
  const failed = state.status === "failed";
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("span", { className: `badge ${failed ? "badge-danger" : "badge-light"}`, children: state.statusLabel }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 142,
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
        lineNumber: 145,
        columnNumber: 21
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 144,
      columnNumber: 17
    }, this),
    failed && state.message && /* @__PURE__ */ jsxDEV("div", { className: "small text-danger mt-1", children: state.message }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 158,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 141,
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
    lineNumber: 176,
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
      lineNumber: 362,
      columnNumber: 16
    }, this);
  }
  if (!payload) {
    return /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 366,
      columnNumber: 16
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager", children: [
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [
        /* @__PURE__ */ jsxDEV("h5", { className: "mb-0", children: "Dokumente" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 373,
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
            lineNumber: 374,
            columnNumber: 21
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 372,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-striped", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Name" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 386,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Beschreibung" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 387,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Geltungsbereich" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 388,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI-Zugriff aktiv" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 389,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "In Vektorstore indizieren" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 390,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 391,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 392,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Aktionen" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 393,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 385,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 384,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          documentRows.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 399,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.description || "-" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 400,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.scope === "global" ? /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-globe", "aria-label": "Globale Quelle", title: "Globale Quelle" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 403,
              columnNumber: 37
            }, this) : /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-graduation-cap", "aria-label": "Kursquelle", title: "Kursquelle" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 405,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 401,
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
                lineNumber: 410,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 409,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 408,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
              "input",
              {
                id: `document-index-${row.id}`,
                className: "form-check-input",
                type: "checkbox",
                role: "switch",
                checked: row.indexState.allowIndex,
                disabled: saving || !row.enabled || !row.canedit || isActive(row.indexState),
                onChange: () => handleAllowIndexToggle(row.id, !row.indexState.allowIndex),
                "aria-label": `Dokument ${row.name} in Vektorstore indizieren`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 428,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 427,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 426,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(IndexStatusCell, { state: row.indexState }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 440,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 440,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: formatTimestamp(row.indexState.lastIndexedAt) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 441,
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
                    lineNumber: 458,
                    columnNumber: 45
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 445,
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
                    lineNumber: 468,
                    columnNumber: 45
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 460,
                  columnNumber: 41
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 444,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 442,
              columnNumber: 29
            }, this)
          ] }, row.id, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 398,
            columnNumber: 25
          }, this)),
          documentRows.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 8, className: "text-muted", children: "Keine Dokumente vorhanden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 477,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 476,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 396,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 383,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 371,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("h5", { children: "Aktivit\xE4ten dieses Kurses" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 485,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-hover", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Aktivit\xE4t" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 489,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Typ" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 490,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI-Zugriff aktiv" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 491,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "In Vektorstore indizieren" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 492,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 493,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 494,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 488,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 487,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          payload.items.modules.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 500,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.moddisplayname || row.modname }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 501,
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
                lineNumber: 504,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 503,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 502,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
              "input",
              {
                id: `module-index-${row.cmid}`,
                className: "form-check-input",
                type: "checkbox",
                role: "switch",
                checked: row.indexState.allowIndex,
                disabled: saving || !row.enabled || isActive(row.indexState),
                onChange: () => handleAllowIndexToggle(row.sourceid, !row.indexState.allowIndex),
                "aria-label": `Aktivit\xE4t ${row.name} in Vektorstore indizieren`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 522,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 521,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 520,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(IndexStatusCell, { state: row.indexState }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 534,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 534,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: formatTimestamp(row.indexState.lastIndexedAt) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 535,
              columnNumber: 29
            }, this)
          ] }, row.cmid, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 499,
            columnNumber: 25
          }, this)),
          payload.items.modules.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 6, className: "text-muted", children: "Keine unterst\xFCtzten Aktivit\xE4ten gefunden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 540,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 539,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 497,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 486,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted", children: "Hier werden nur Aktivit\xE4ten angezeigt, deren Typ aktuell vom Plugin unterst\xFCtzt wird." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 545,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 484,
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
                lineNumber: 561,
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
                    lineNumber: 569,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 562,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 560,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              payload.canmanagesystemsources && /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { htmlFor: "source-create-scope", children: "Quelle anlegen in" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 575,
                  columnNumber: 45
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "select",
                  {
                    id: "source-create-scope",
                    className: "custom-select",
                    value: createScope ?? "course",
                    onChange: (e) => setCreateScope(e.target.value === "global" ? "global" : "course"),
                    children: [
                      /* @__PURE__ */ jsxDEV("option", { value: "course", children: "Diesem Kurs" }, void 0, false, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 582,
                        columnNumber: 49
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "global", children: "Systemkontext (global)" }, void 0, false, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 583,
                        columnNumber: 49
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 576,
                    columnNumber: 45
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 574,
                columnNumber: 41
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 588,
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
                    lineNumber: 589,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 587,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 596,
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
                    lineNumber: 597,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 595,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 604,
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
                    lineNumber: 605,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 603,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 572,
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
                  lineNumber: 614,
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
                  lineNumber: 621,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 613,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 559,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 558,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 552,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeCreateModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 632,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 551,
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
                lineNumber: 647,
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
                    lineNumber: 655,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 648,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 646,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 660,
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
                    lineNumber: 661,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 659,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 668,
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
                    lineNumber: 669,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 667,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 676,
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
                    lineNumber: 677,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 675,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 658,
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
                  lineNumber: 686,
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
                  lineNumber: 693,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 685,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 645,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 644,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 638,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: () => setEditingDocument(null) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 704,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 637,
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
                lineNumber: 719,
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
                    lineNumber: 727,
                    columnNumber: 41
                  }, this)
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
              lineNumber: 718,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              "M\xF6chtest du die Quelle \u201E",
              deleteCandidate.name,
              "\u201C wirklich l\xF6schen?"
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 730,
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
                  lineNumber: 734,
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
                  lineNumber: 741,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 733,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 717,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 716,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 710,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: () => setDeleteCandidate(null) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 752,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 709,
      columnNumber: 17
    }, this),
    error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 756,
      columnNumber: 23
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 370,
    columnNumber: 9
  }, this);
}
__name(SourceManager, "SourceManager");
export {
  SourceManager as default
};
//# sourceMappingURL=source_manager.dev.js.map

import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
/**
 * React source management UI for course-level source configuration.
 *
 * @module     local_ai_content/source_manager
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Fetch from "@moodle/lms/core/fetch";
import { Button, ProgressBar } from "@moodlehq/design-system";
const DEFAULT_PROGRESS_POLL_MS = 5e3;
function normalizeProgressPollMs(timeoutseconds) {
  if (!Number.isFinite(timeoutseconds)) {
    return DEFAULT_PROGRESS_POLL_MS;
  }
  const secondssafe = Math.max(1, Math.min(60, Math.round(timeoutseconds ?? 5)));
  return secondssafe * 1e3;
}
function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "-";
  }
  const parsed = new Date(timestamp);
  if (isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString();
}
function normalizeManagementResponse(data) {
  const sourceitems = data.items ?? {};
  const normalizemodule = (raw) => ({
    cmid: Number(raw.cmid ?? 0),
    modname: String(raw.modname ?? ""),
    moddisplayname: String(raw.moddisplayname ?? ""),
    name: String(raw.name ?? ""),
    sourceid: Number(raw.sourceid ?? 0),
    enabled: Boolean(raw.enabled ?? false),
    allowindex: Boolean(raw.allowindex ?? false),
    indexstatus: String(raw.indexstatus ?? ""),
    indexstatuslabel: String(raw.indexstatuslabel ?? ""),
    lastindexed: raw.lastindexed ?? raw.lastIndexedAt ?? null,
    indextaskid: Number(raw.indextaskid ?? 0),
    progressrecordid: Number(raw.progressrecordid ?? 0),
    progresspercent: Number(raw.progresspercent ?? 0),
    progressmessage: String(raw.progressmessage ?? ""),
    progresserror: Boolean(raw.progresserror ?? false)
  });
  const normalizedocument = (raw) => ({
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    content: String(raw.content ?? ""),
    enabled: Boolean(raw.enabled ?? false),
    allowindex: Boolean(raw.allowindex ?? false),
    indexstatus: String(raw.indexstatus ?? ""),
    indexstatuslabel: String(raw.indexstatuslabel ?? ""),
    lastindexed: raw.lastindexed ?? raw.lastIndexedAt ?? null,
    indextaskid: Number(raw.indextaskid ?? 0),
    progressrecordid: Number(raw.progressrecordid ?? 0),
    progresspercent: Number(raw.progresspercent ?? 0),
    progressmessage: String(raw.progressmessage ?? ""),
    progresserror: Boolean(raw.progresserror ?? false),
    canedit: Boolean(raw.canedit ?? false)
  });
  const modules = (sourceitems.modules ?? data.modules ?? []).map((item) => normalizemodule(item));
  const globaldocuments = (sourceitems.globaldocuments ?? data.globaldocuments ?? []).map((item) => normalizedocument(item));
  const coursedocuments = (sourceitems.coursedocuments ?? data.coursedocuments ?? []).map((item) => normalizedocument(item));
  return {
    coursecontextid: data.coursecontextid,
    canmanagesystemsources: data.canmanagesystemsources,
    modules,
    globaldocuments,
    coursedocuments
  };
}
function isActiveStatus(status) {
  return status === "queued" || status === "running";
}
function shouldRenderProgress(status, progressrecordid, indextaskid) {
  return isActiveStatus(status) || progressrecordid > 0 || indextaskid > 0;
}
function StoredProgress({ percent, message, error, active }) {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const visiblepercent = active && normalized === 0 ? 2 : normalized;
  const status = error ? "error" : active ? "loading" : "in-progress";
  return /* @__PURE__ */ jsxDEV("div", { className: "mt-1", children: [
    /* @__PURE__ */ jsxDEV(
      ProgressBar,
      {
        value: visiblepercent,
        min: 0,
        max: 100,
        status,
        labelVariant: "none",
        title: message || "Indexing progress",
        count: `${Math.round(normalized)}%`,
        animated: active
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 215,
        columnNumber: 13
      },
      this
    ),
    (message || error) && /* @__PURE__ */ jsxDEV("div", { className: `small ${error ? "text-danger" : "text-muted"} mt-1`, children: message }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 226,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 214,
    columnNumber: 9
  }, this);
}
function mergeProgressData(payload, items) {
  const updates = /* @__PURE__ */ new Map();
  items.forEach((item) => updates.set(item.sourceid, item));
  return {
    ...payload,
    modules: payload.modules.map((row) => {
      const update = updates.get(row.sourceid);
      if (!update) {
        return row;
      }
      return {
        ...row,
        indexstatus: update.indexstatus,
        indexstatuslabel: update.indexstatuslabel,
        indextaskid: update.indextaskid,
        lastindexed: update.lastIndexedAt,
        progressrecordid: update.progressrecordid,
        progresspercent: update.progresspercent,
        progressmessage: update.progressmessage,
        progresserror: update.progresserror
      };
    }),
    globaldocuments: payload.globaldocuments.map((row) => {
      const update = updates.get(row.id);
      if (!update) {
        return row;
      }
      return {
        ...row,
        indexstatus: update.indexstatus,
        indexstatuslabel: update.indexstatuslabel,
        indextaskid: update.indextaskid,
        lastindexed: update.lastIndexedAt,
        progressrecordid: update.progressrecordid,
        progresspercent: update.progresspercent,
        progressmessage: update.progressmessage,
        progresserror: update.progresserror
      };
    }),
    coursedocuments: payload.coursedocuments.map((row) => {
      const update = updates.get(row.id);
      if (!update) {
        return row;
      }
      return {
        ...row,
        indexstatus: update.indexstatus,
        indexstatuslabel: update.indexstatuslabel,
        indextaskid: update.indextaskid,
        lastindexed: update.lastIndexedAt,
        progressrecordid: update.progressrecordid,
        progresspercent: update.progresspercent,
        progressmessage: update.progressmessage,
        progresserror: update.progresserror
      };
    })
  };
}
function SourceManager({ contextid }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [createScope, setCreateScope] = useState(null);
  const [newDocument, setNewDocument] = useState({ id: 0, name: "", description: "", content: "" });
  const [progressPollMs, setProgressPollMs] = useState(DEFAULT_PROGRESS_POLL_MS);
  const plusIcon = /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-plus", "aria-hidden": "true" }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 304,
    columnNumber: 22
  }, this);
  const refreshInFlightRef = useRef(false);
  const documentRows = useMemo(() => {
    if (!payload) {
      return [];
    }
    const globalrows = payload.globaldocuments.map((row) => ({ ...row, scope: "global" }));
    const courserows = payload.coursedocuments.map((row) => ({ ...row, scope: "course" }));
    return [...globalrows, ...courserows].sort((a, b) => a.name.localeCompare(b.name));
  }, [payload]);
  const hasActiveTasks = useMemo(() => {
    if (!payload) {
      return false;
    }
    const modulesActive = payload.modules.some(
      (row) => shouldRenderProgress(row.indexstatus, row.progressrecordid, row.indextaskid)
    );
    const globalActive = payload.globaldocuments.some(
      (row) => shouldRenderProgress(row.indexstatus, row.progressrecordid, row.indextaskid)
    );
    const courseActive = payload.coursedocuments.some(
      (row) => shouldRenderProgress(row.indexstatus, row.progressrecordid, row.indextaskid)
    );
    return modulesActive || globalActive || courseActive;
  }, [payload]);
  const loadPayload = async (background = false) => {
    if (background && refreshInFlightRef.current) {
      return;
    }
    if (!background) {
      setLoading(true);
    } else {
      refreshInFlightRef.current = true;
    }
    setError(null);
    try {
      const res = await Fetch.performGet("local_ai_content", `contexts/${contextid}/sources`);
      const data = await res.json();
      setPayload(normalizeManagementResponse(data));
    } catch {
      setError("Die Quellen konnten nicht geladen werden.");
    } finally {
      if (!background) {
        setLoading(false);
      } else {
        refreshInFlightRef.current = false;
      }
    }
  };
  const loadProgress = async () => {
    try {
      const res = await Fetch.performGet("local_ai_content", `contexts/${contextid}/source-progresses`);
      const data = await res.json();
      setProgressPollMs(normalizeProgressPollMs(data.pollIntervalSeconds));
      setPayload((current) => {
        if (!current) {
          return current;
        }
        return mergeProgressData(current, data.items ?? []);
      });
    } catch {
    }
  };
  const performWrite = async (method, path, body) => {
    setSaving(true);
    setError(null);
    try {
      const res = await Fetch.request("local_ai_content", path, {
        method,
        body
      });
      if (!res.ok) {
        setError(`Speichern fehlgeschlagen (HTTP ${res.status}).`);
        return false;
      }
      await loadPayload(true);
      return true;
    } catch {
      setError("Die Aktion konnte nicht ausgef\xFChrt werden.");
      return false;
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    loadPayload();
  }, [contextid]);
  useEffect(() => {
    let timer = null;
    if (hasActiveTasks) {
      timer = window.setInterval(() => {
        void loadProgress();
      }, progressPollMs);
    }
    return () => {
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [hasActiveTasks, contextid, progressPollMs]);
  const handleModuleEnabledToggle = async (row, enabled) => {
    await performWrite("PATCH", `contexts/${contextid}/module-sources/${row.cmid}`, { enabled });
  };
  const handleModuleAllowIndexToggle = async (row, allowindex) => {
    await performWrite("PATCH", `contexts/${contextid}/module-sources/${row.cmid}`, { allowIndex: allowindex });
  };
  const handleDocumentEnabledToggle = async (row, enabled) => {
    await performWrite("PATCH", `contexts/${contextid}/document-sources/${row.id}`, { enabled });
  };
  const handleDocumentAllowIndexToggle = async (row, allowindex) => {
    await performWrite("PATCH", `contexts/${contextid}/document-sources/${row.id}`, { allowIndex: allowindex });
  };
  const openCreateModal = () => {
    setError(null);
    setCreateScope("course");
    setNewDocument({ id: 0, name: "", description: "", content: "" });
  };
  const closeCreateModal = () => {
    setCreateScope(null);
  };
  const handleCreateDocument = async () => {
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
  };
  const handleUpdateDocument = async () => {
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
  };
  const handleDeleteDocument = async () => {
    if (!deleteCandidate) {
      return;
    }
    const deleted = await performWrite("DELETE", `contexts/${contextid}/document-sources/${deleteCandidate.id}`);
    if (deleted) {
      setDeleteCandidate(null);
    }
  };
  const renderDocumentTable = (rows) => /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [
      /* @__PURE__ */ jsxDEV("h5", { className: "mb-0", children: "Dokumente" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 485,
        columnNumber: 17
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
          lineNumber: 486,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 484,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-striped", children: [
      /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
        /* @__PURE__ */ jsxDEV("th", { children: "Name" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 498,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Beschreibung" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 499,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Geltungsbereich" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 500,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI-Zugriff aktiv" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 501,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "In Vektorstore indizieren" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 502,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 503,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 504,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Aktionen" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 505,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 497,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 496,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("tbody", { children: [
        rows.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 511,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: row.description || "-" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 512,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: row.scope === "global" ? /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-globe", "aria-label": "Globale Quelle", title: "Globale Quelle" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 515,
            columnNumber: 37
          }, this) : /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-graduation-cap", "aria-label": "Kursquelle", title: "Kursquelle" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 517,
            columnNumber: 37
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 513,
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
              onChange: () => handleDocumentEnabledToggle(row, !row.enabled),
              "aria-label": `Dokument ${row.name} f\xFCr KI-Zugriff aktivieren`
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
          /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
            "input",
            {
              id: `document-index-${row.id}`,
              className: "form-check-input",
              type: "checkbox",
              role: "switch",
              checked: row.allowindex,
              disabled: saving || !row.enabled || !row.canedit,
              onChange: () => handleDocumentAllowIndexToggle(row, !row.allowindex),
              "aria-label": `Dokument ${row.name} in Vektorstore indizieren`
            },
            void 0,
            false,
            {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 536,
              columnNumber: 37
            },
            this
          ) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 535,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 534,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: [
            /* @__PURE__ */ jsxDEV("span", { className: "badge badge-light", children: row.indexstatuslabel }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 549,
              columnNumber: 33
            }, this),
            shouldRenderProgress(row.indexstatus, row.progressrecordid, row.indextaskid) && /* @__PURE__ */ jsxDEV(
              StoredProgress,
              {
                percent: row.progresspercent,
                message: row.progressmessage || row.indexstatuslabel,
                error: row.progresserror,
                active: isActiveStatus(row.indexstatus)
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 551,
                columnNumber: 37
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 548,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: formatTimestamp(row.lastindexed) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 559,
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
                  lineNumber: 576,
                  columnNumber: 45
                }, this)
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 563,
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
                  lineNumber: 586,
                  columnNumber: 45
                }, this)
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 578,
                columnNumber: 41
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 562,
            columnNumber: 37
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 560,
            columnNumber: 29
          }, this)
        ] }, row.id, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 510,
          columnNumber: 25
        }, this)),
        rows.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 8, className: "text-muted", children: "Keine Dokumente vorhanden." }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 595,
          columnNumber: 29
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 594,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 508,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 495,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 483,
    columnNumber: 9
  }, this);
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager local-ai-content-source-manager--loading", children: "Lade Quellen..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 604,
      columnNumber: 16
    }, this);
  }
  if (!payload) {
    return /* @__PURE__ */ jsxDEV("div", { className: "text-danger", children: "Keine Daten verf\xFCgbar." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 608,
      columnNumber: 16
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager", children: [
    renderDocumentTable(documentRows),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("h5", { children: "Aktivit\xE4ten dieses Kurses" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 616,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-hover", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Aktivit\xE4t" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 620,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Typ" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 621,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI-Zugriff aktiv" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 622,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "In Vektorstore indizieren" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 623,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 624,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 625,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 619,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 618,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          payload.modules.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 631,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.moddisplayname || row.modname }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 632,
              columnNumber: 33
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
                onChange: () => handleModuleEnabledToggle(row, !row.enabled),
                "aria-label": `Aktivit\xE4t ${row.name} f\xFCr KI-Zugriff aktivieren`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 635,
                columnNumber: 41
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 634,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 633,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
              "input",
              {
                id: `module-index-${row.cmid}`,
                className: "form-check-input",
                type: "checkbox",
                role: "switch",
                checked: row.allowindex,
                disabled: saving || !row.enabled,
                onChange: () => handleModuleAllowIndexToggle(row, !row.allowindex),
                "aria-label": `Aktivit\xE4t ${row.name} in Vektorstore indizieren`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 649,
                columnNumber: 41
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 648,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 647,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: [
              /* @__PURE__ */ jsxDEV("span", { className: "badge badge-light", children: row.indexstatuslabel }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 662,
                columnNumber: 37
              }, this),
              shouldRenderProgress(row.indexstatus, row.progressrecordid, row.indextaskid) && /* @__PURE__ */ jsxDEV(
                StoredProgress,
                {
                  percent: row.progresspercent,
                  message: row.progressmessage || row.indexstatuslabel,
                  error: row.progresserror,
                  active: isActiveStatus(row.indexstatus)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 664,
                  columnNumber: 41
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 661,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: formatTimestamp(row.lastindexed) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 672,
              columnNumber: 33
            }, this)
          ] }, row.cmid, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 630,
            columnNumber: 29
          }, this)),
          payload.modules.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 6, className: "text-muted", children: "Keine unterst\xFCtzten Aktivit\xE4ten gefunden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 677,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 676,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 628,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 617,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted", children: "Hier werden nur Aktivit\xE4ten angezeigt, deren Typ aktuell vom Plugin unterst\xFCtzt wird." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 682,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 615,
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
                lineNumber: 698,
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
                    lineNumber: 706,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 699,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 697,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              payload.canmanagesystemsources && /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { htmlFor: "source-create-scope", children: "Quelle anlegen in" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 712,
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
                        lineNumber: 719,
                        columnNumber: 49
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "global", children: "Systemkontext (global)" }, void 0, false, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 720,
                        columnNumber: 49
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 713,
                    columnNumber: 45
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 711,
                columnNumber: 41
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 725,
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
                    lineNumber: 726,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 724,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 733,
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
                    lineNumber: 734,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 732,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 741,
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
                    lineNumber: 742,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 740,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 709,
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
                  lineNumber: 751,
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
                  lineNumber: 758,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 750,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 696,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 695,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 689,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeCreateModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 769,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 688,
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
                lineNumber: 784,
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
                    lineNumber: 792,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 785,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 783,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 797,
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
                    lineNumber: 798,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 796,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 805,
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
                    lineNumber: 806,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 804,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 813,
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
                    lineNumber: 814,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 812,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 795,
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
                  lineNumber: 823,
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
                  lineNumber: 830,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 822,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 782,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 781,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 775,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: () => setEditingDocument(null) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 841,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 774,
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
                lineNumber: 856,
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
                    lineNumber: 864,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 857,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 855,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              "M\xF6chtest du die Quelle \u201E",
              deleteCandidate.name,
              "\u201C wirklich l\xF6schen?"
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 867,
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
                  lineNumber: 871,
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
                  lineNumber: 878,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 870,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 854,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 853,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 847,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: () => setDeleteCandidate(null) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 889,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 846,
      columnNumber: 17
    }, this),
    error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 893,
      columnNumber: 23
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 612,
    columnNumber: 9
  }, this);
}
export {
  SourceManager as default
};
//# sourceMappingURL=source_manager.dev.js.map

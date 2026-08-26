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
import Fetch from "@moodle/lms/core/fetch";
import Config from "@moodle/lms/core/config";
import { Button, ProgressBar } from "@moodlehq/design-system";
const DEFAULT_PROGRESS_POLL_MS = 5e3;
function buildApiUrl(path) {
  const normalizedpath = path.replace(/^\/+/, "");
  const url = new URL(Config.apibase);
  const basepathname = url.pathname.replace(/\/+$/, "");
  url.pathname = `${basepathname}/rest/v2/local_ai_content/${normalizedpath}`.replace(/\/{2,}/g, "/");
  return url.toString();
}
__name(buildApiUrl, "buildApiUrl");
async function extractApiErrorMessage(response) {
  const contenttype = response.headers.get("content-type") ?? "";
  if (contenttype.includes("application/json")) {
    try {
      const payload = await response.json();
      const message = typeof payload.message === "string" ? payload.message.trim() : "";
      const debuginfo = typeof payload.debuginfo === "string" ? payload.debuginfo.trim() : "";
      if (message && debuginfo) {
        return `${message} (${debuginfo})`;
      }
      if (message) {
        return message;
      }
      const error = typeof payload.error === "string" ? payload.error.trim() : "";
      if (error) {
        return error;
      }
    } catch {
    }
  }
  try {
    const text = (await response.text()).trim();
    if (text) {
      return text;
    }
  } catch {
  }
  return null;
}
__name(extractApiErrorMessage, "extractApiErrorMessage");
function extractThrownErrorMessage(error) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  return null;
}
__name(extractThrownErrorMessage, "extractThrownErrorMessage");
function normalizeProgressPollMs(timeoutseconds) {
  if (!Number.isFinite(timeoutseconds)) {
    return DEFAULT_PROGRESS_POLL_MS;
  }
  const secondssafe = Math.max(1, Math.min(60, Math.round(timeoutseconds ?? 5)));
  return secondssafe * 1e3;
}
__name(normalizeProgressPollMs, "normalizeProgressPollMs");
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
__name(formatTimestamp, "formatTimestamp");
function normalizeManagementResponse(data) {
  const sourceitems = data.items ?? {};
  const normalizemodule = /* @__PURE__ */ __name((raw) => ({
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
  }), "normalizemodule");
  const normalizedocument = /* @__PURE__ */ __name((raw) => ({
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
  }), "normalizedocument");
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
__name(normalizeManagementResponse, "normalizeManagementResponse");
function isActiveStatus(status) {
  return status === "queued" || status === "running";
}
__name(isActiveStatus, "isActiveStatus");
function shouldRenderProgress(status, progressrecordid, indextaskid) {
  return isActiveStatus(status) || progressrecordid > 0 || indextaskid > 0;
}
__name(shouldRenderProgress, "shouldRenderProgress");
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
        lineNumber: 289,
        columnNumber: 13
      },
      this
    ),
    (message || error) && /* @__PURE__ */ jsxDEV("div", { className: `small ${error ? "text-danger" : "text-muted"} mt-1`, children: message }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 300,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 288,
    columnNumber: 9
  }, this);
}
__name(StoredProgress, "StoredProgress");
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
      const allowindex = update.indexstatus === "failed" ? false : row.allowindex;
      return {
        ...row,
        allowindex,
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
      const allowindex = update.indexstatus === "failed" ? false : row.allowindex;
      return {
        ...row,
        allowindex,
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
      const allowindex = update.indexstatus === "failed" ? false : row.allowindex;
      return {
        ...row,
        allowindex,
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
__name(mergeProgressData, "mergeProgressData");
function applyVectorStatusToPayload(payload, status) {
  const updatedocument = /* @__PURE__ */ __name((row) => {
    if (row.id !== status.sourceId) {
      return row;
    }
    return {
      ...row,
      allowindex: status.allowIndex,
      indexstatus: status.indexStatus,
      indexstatuslabel: status.indexStatusLabel,
      lastindexed: status.lastIndexedAt
    };
  }, "updatedocument");
  return {
    ...payload,
    modules: payload.modules.map((row) => {
      if (row.sourceid !== status.sourceId) {
        return row;
      }
      return {
        ...row,
        allowindex: status.allowIndex,
        indexstatus: status.indexStatus,
        indexstatuslabel: status.indexStatusLabel,
        lastindexed: status.lastIndexedAt
      };
    }),
    globaldocuments: payload.globaldocuments.map((row) => updatedocument(row)),
    coursedocuments: payload.coursedocuments.map((row) => updatedocument(row))
  };
}
__name(applyVectorStatusToPayload, "applyVectorStatusToPayload");
function SourceManager({ contextid }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [vectorCheckState, setVectorCheckState] = useState({});
  const [editingDocument, setEditingDocument] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [createScope, setCreateScope] = useState(null);
  const [newDocument, setNewDocument] = useState({ id: 0, name: "", description: "", content: "" });
  const [progressPollMs, setProgressPollMs] = useState(DEFAULT_PROGRESS_POLL_MS);
  const plusIcon = /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-plus", "aria-hidden": "true" }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 423,
    columnNumber: 22
  }, this);
  const refreshInFlightRef = useRef(false);
  const vectorCheckRunRef = useRef(0);
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
    const modulesActive = payload.modules.some((row) => isActiveStatus(row.indexstatus));
    const globalActive = payload.globaldocuments.some((row) => isActiveStatus(row.indexstatus));
    const courseActive = payload.coursedocuments.some((row) => isActiveStatus(row.indexstatus));
    return modulesActive || globalActive || courseActive;
  }, [payload]);
  const loadPayload = /* @__PURE__ */ __name(async (background = false) => {
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
      const normalized = normalizeManagementResponse(data);
      setPayload(normalized);
      startVectorStatusChecks(normalized);
    } catch {
      setError("Die Quellen konnten nicht geladen werden.");
    } finally {
      if (!background) {
        setLoading(false);
      } else {
        refreshInFlightRef.current = false;
      }
    }
  }, "loadPayload");
  const loadProgress = /* @__PURE__ */ __name(async () => {
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
  }, "loadProgress");
  const performWrite = /* @__PURE__ */ __name(async (method, path, body) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl(path), {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          pageparent: Config.traceId || ""
        },
        body: body ? JSON.stringify(body) : void 0,
        credentials: "same-origin"
      });
      if (!res.ok) {
        const detail = await extractApiErrorMessage(res);
        const fallback = res.statusText ? `HTTP ${res.status} (${res.statusText})` : `HTTP ${res.status}`;
        setError(detail ? `Die Aktion konnte nicht ausgef\xFChrt werden: ${detail}` : `Die Aktion konnte nicht ausgef\xFChrt werden (${fallback}).`);
        return false;
      }
      await loadPayload(true);
      return true;
    } catch (error2) {
      const detail = extractThrownErrorMessage(error2);
      setError(detail ? `Die Aktion konnte nicht ausgef\xFChrt werden: ${detail}` : "Die Aktion konnte nicht ausgef\xFChrt werden.");
      return false;
    } finally {
      setSaving(false);
    }
  }, "performWrite");
  const checkSingleSourceVectorStatus = /* @__PURE__ */ __name(async (sourceid, runid) => {
    try {
      const res = await fetch(buildApiUrl(`sources/${sourceid}/vector-status`), {
        method: "GET",
        headers: {
          Accept: "application/json",
          pageparent: Config.traceId || ""
        },
        credentials: "same-origin"
      });
      if (vectorCheckRunRef.current !== runid) {
        return;
      }
      if (!res.ok) {
        const detail = await extractApiErrorMessage(res);
        setVectorCheckState((current) => ({
          ...current,
          [sourceid]: {
            checking: false,
            error: detail ? `Vektor-DB-Pruefung fehlgeschlagen: ${detail}` : "Vektor-DB-Pruefung fehlgeschlagen."
          }
        }));
        return;
      }
      const status = await res.json();
      if (vectorCheckRunRef.current !== runid) {
        return;
      }
      if (!status.connected) {
        setVectorCheckState((current) => ({
          ...current,
          [sourceid]: {
            checking: false,
            error: status.message || "Keine Verbindung zur Vektor-DB."
          }
        }));
        return;
      }
      setPayload((current) => {
        if (!current) {
          return current;
        }
        return applyVectorStatusToPayload(current, status);
      });
      setVectorCheckState((current) => ({
        ...current,
        [sourceid]: {
          checking: false,
          error: null
        }
      }));
    } catch (caughtError) {
      if (vectorCheckRunRef.current !== runid) {
        return;
      }
      const detail = extractThrownErrorMessage(caughtError);
      setVectorCheckState((current) => ({
        ...current,
        [sourceid]: {
          checking: false,
          error: detail ? `Keine Verbindung zur Vektor-DB: ${detail}` : "Keine Verbindung zur Vektor-DB."
        }
      }));
    }
  }, "checkSingleSourceVectorStatus");
  const startVectorStatusChecks = /* @__PURE__ */ __name((currentpayload) => {
    const sourceids = [
      ...currentpayload.modules.map((row) => row.sourceid),
      ...currentpayload.globaldocuments.map((row) => row.id),
      ...currentpayload.coursedocuments.map((row) => row.id)
    ].filter((sourceid, index, all) => sourceid > 0 && all.indexOf(sourceid) === index);
    if (sourceids.length === 0) {
      setVectorCheckState({});
      return;
    }
    const runid = vectorCheckRunRef.current + 1;
    vectorCheckRunRef.current = runid;
    setVectorCheckState((current) => {
      const next = { ...current };
      sourceids.forEach((sourceid) => {
        next[sourceid] = {
          checking: true,
          error: null
        };
      });
      return next;
    });
    sourceids.forEach((sourceid) => {
      void checkSingleSourceVectorStatus(sourceid, runid);
    });
  }, "startVectorStatusChecks");
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
  const handleModuleEnabledToggle = /* @__PURE__ */ __name(async (row, enabled) => {
    await performWrite("PATCH", `contexts/${contextid}/module-sources/${row.cmid}`, { enabled });
  }, "handleModuleEnabledToggle");
  const handleModuleAllowIndexToggle = /* @__PURE__ */ __name(async (row, allowindex) => {
    await performWrite("PATCH", `contexts/${contextid}/module-sources/${row.cmid}`, { allowIndex: allowindex });
  }, "handleModuleAllowIndexToggle");
  const handleDocumentEnabledToggle = /* @__PURE__ */ __name(async (row, enabled) => {
    await performWrite("PATCH", `contexts/${contextid}/document-sources/${row.id}`, { enabled });
  }, "handleDocumentEnabledToggle");
  const handleDocumentAllowIndexToggle = /* @__PURE__ */ __name(async (row, allowindex) => {
    await performWrite("PATCH", `contexts/${contextid}/document-sources/${row.id}`, { allowIndex: allowindex });
  }, "handleDocumentAllowIndexToggle");
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
  const renderDocumentTable = /* @__PURE__ */ __name((rows) => /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [
      /* @__PURE__ */ jsxDEV("h5", { className: "mb-0", children: "Dokumente" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 714,
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
          lineNumber: 715,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 713,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-striped", children: [
      /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
        /* @__PURE__ */ jsxDEV("th", { children: "Name" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 727,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Beschreibung" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 728,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Geltungsbereich" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 729,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI-Zugriff aktiv" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 730,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "In Vektorstore indizieren" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 731,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 732,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 733,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Aktionen" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 734,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 726,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 725,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("tbody", { children: [
        rows.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 740,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: row.description || "-" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 741,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: row.scope === "global" ? /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-globe", "aria-label": "Globale Quelle", title: "Globale Quelle" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 744,
            columnNumber: 33
          }, this) : /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-graduation-cap", "aria-label": "Kursquelle", title: "Kursquelle" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 746,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 742,
            columnNumber: 25
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
              lineNumber: 751,
              columnNumber: 33
            },
            this
          ) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 750,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 749,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: [
            (() => {
              const vectorcheck = vectorCheckState[row.id];
              const blocktoggle = Boolean(vectorcheck?.checking || vectorcheck?.error);
              return /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
                "input",
                {
                  id: `document-index-${row.id}`,
                  className: "form-check-input",
                  type: "checkbox",
                  role: "switch",
                  checked: row.allowindex,
                  disabled: saving || !row.enabled || !row.canedit || blocktoggle,
                  onChange: () => handleDocumentAllowIndexToggle(row, !row.allowindex),
                  "aria-label": `Dokument ${row.name} in Vektorstore indizieren`
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 769,
                  columnNumber: 33
                },
                this
              ) }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 768,
                columnNumber: 29
              }, this);
            })(),
            vectorCheckState[row.id]?.checking && /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mt-1", children: "Pruefe Vektor-DB..." }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 783,
              columnNumber: 33
            }, this),
            vectorCheckState[row.id]?.error && /* @__PURE__ */ jsxDEV("div", { className: "small text-danger mt-1", children: vectorCheckState[row.id]?.error }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 786,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 763,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: [
            /* @__PURE__ */ jsxDEV("span", { className: "badge badge-light", children: row.indexstatuslabel }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 790,
              columnNumber: 29
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
                lineNumber: 792,
                columnNumber: 33
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 789,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: formatTimestamp(row.lastindexed) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 800,
            columnNumber: 25
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
                  lineNumber: 817,
                  columnNumber: 41
                }, this)
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 804,
                columnNumber: 37
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
                  lineNumber: 827,
                  columnNumber: 41
                }, this)
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 819,
                columnNumber: 37
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 803,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 801,
            columnNumber: 25
          }, this)
        ] }, row.id, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 739,
          columnNumber: 21
        }, this)),
        rows.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 8, className: "text-muted", children: "Keine Dokumente vorhanden." }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 836,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 835,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 737,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 724,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 712,
    columnNumber: 9
  }, this), "renderDocumentTable");
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager local-ai-content-source-manager--loading", children: "Lade Quellen..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 845,
      columnNumber: 16
    }, this);
  }
  if (!payload) {
    return /* @__PURE__ */ jsxDEV("div", { className: "text-danger", children: "Keine Daten verf\xFCgbar." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 849,
      columnNumber: 16
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager", children: [
    renderDocumentTable(documentRows),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("h5", { children: "Aktivit\xE4ten dieses Kurses" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 857,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-hover", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Aktivit\xE4t" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 861,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Typ" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 862,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI-Zugriff aktiv" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 863,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "In Vektorstore indizieren" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 864,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 865,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 866,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 860,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 859,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          payload.modules.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 872,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.moddisplayname || row.modname }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 873,
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
                onChange: () => handleModuleEnabledToggle(row, !row.enabled),
                "aria-label": `Aktivit\xE4t ${row.name} f\xFCr KI-Zugriff aktivieren`
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 876,
                columnNumber: 37
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 875,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 874,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: [
              (() => {
                const vectorcheck = row.sourceid > 0 ? vectorCheckState[row.sourceid] : null;
                const blocktoggle = Boolean(vectorcheck?.checking || vectorcheck?.error);
                return /* @__PURE__ */ jsxDEV("div", { className: "form-check form-switch m-0", children: /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    id: `module-index-${row.cmid}`,
                    className: "form-check-input",
                    type: "checkbox",
                    role: "switch",
                    checked: row.allowindex,
                    disabled: saving || !row.enabled || blocktoggle,
                    onChange: () => handleModuleAllowIndexToggle(row, !row.allowindex),
                    "aria-label": `Aktivit\xE4t ${row.name} in Vektorstore indizieren`
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 894,
                    columnNumber: 37
                  },
                  this
                ) }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 893,
                  columnNumber: 33
                }, this);
              })(),
              row.sourceid > 0 && vectorCheckState[row.sourceid]?.checking && /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mt-1", children: "Pruefe Vektor-DB..." }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 908,
                columnNumber: 37
              }, this),
              row.sourceid > 0 && vectorCheckState[row.sourceid]?.error && /* @__PURE__ */ jsxDEV("div", { className: "small text-danger mt-1", children: vectorCheckState[row.sourceid]?.error }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 911,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 888,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: [
              /* @__PURE__ */ jsxDEV("span", { className: "badge badge-light", children: row.indexstatuslabel }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 915,
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
                  lineNumber: 917,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 914,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: formatTimestamp(row.lastindexed) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 925,
              columnNumber: 29
            }, this)
          ] }, row.cmid, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 871,
            columnNumber: 25
          }, this)),
          payload.modules.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 6, className: "text-muted", children: "Keine unterst\xFCtzten Aktivit\xE4ten gefunden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 930,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 929,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 869,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 858,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted", children: "Hier werden nur Aktivit\xE4ten angezeigt, deren Typ aktuell vom Plugin unterst\xFCtzt wird." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 935,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 856,
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
                lineNumber: 951,
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
                    lineNumber: 959,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 952,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 950,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              payload.canmanagesystemsources && /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { htmlFor: "source-create-scope", children: "Quelle anlegen in" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 965,
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
                        lineNumber: 972,
                        columnNumber: 49
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "global", children: "Systemkontext (global)" }, void 0, false, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 973,
                        columnNumber: 49
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 966,
                    columnNumber: 45
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 964,
                columnNumber: 41
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 978,
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
                    lineNumber: 979,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 977,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 986,
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
                    lineNumber: 987,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 985,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 994,
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
                    lineNumber: 995,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 993,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 962,
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
                  lineNumber: 1004,
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
                  lineNumber: 1011,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 1003,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 949,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 948,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 942,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeCreateModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1022,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 941,
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
                lineNumber: 1037,
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
                    lineNumber: 1045,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 1038,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 1036,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 1050,
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
                    lineNumber: 1051,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 1049,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 1058,
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
                    lineNumber: 1059,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 1057,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 1066,
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
                    lineNumber: 1067,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 1065,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 1048,
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
                  lineNumber: 1076,
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
                  lineNumber: 1083,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 1075,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1035,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1034,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 1028,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: () => setEditingDocument(null) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1094,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1027,
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
                lineNumber: 1109,
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
                    lineNumber: 1117,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 1110,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 1108,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              "M\xF6chtest du die Quelle \u201E",
              deleteCandidate.name,
              "\u201C wirklich l\xF6schen?"
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 1120,
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
                  lineNumber: 1124,
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
                  lineNumber: 1131,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 1123,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1107,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1106,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 1100,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: () => setDeleteCandidate(null) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1142,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1099,
      columnNumber: 17
    }, this),
    error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1146,
      columnNumber: 23
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 853,
    columnNumber: 9
  }, this);
}
__name(SourceManager, "SourceManager");
export {
  SourceManager as default
};
//# sourceMappingURL=source_manager.dev.js.map

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
import { useEffect, useMemo, useState } from "react";
import Fetch from "@moodle/lms/core/fetch";
import { Button } from "@moodlehq/design-system";
function formatTimestamp(timestamp) {
  if (!timestamp || timestamp <= 0) {
    return "-";
  }
  return new Date(timestamp * 1e3).toLocaleString();
}
__name(formatTimestamp, "formatTimestamp");
function isActiveStatus(status) {
  return status === "queued" || status === "running";
}
__name(isActiveStatus, "isActiveStatus");
function StoredProgress({ percent, message, error }) {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const barClass = error ? "bg-danger" : "bg-primary";
  return /* @__PURE__ */ jsxDEV("div", { className: "mt-1", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "progress", style: { height: "0.65rem" }, children: /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: `progress-bar ${barClass}`,
        role: "progressbar",
        style: { width: `${normalized}%` },
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": normalized
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 129,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 128,
      columnNumber: 13
    }, this),
    (message || error) && /* @__PURE__ */ jsxDEV("div", { className: `small ${error ? "text-danger" : "text-muted"} mt-1`, children: message }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 139,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 127,
    columnNumber: 9
  }, this);
}
__name(StoredProgress, "StoredProgress");
function getSesskey() {
  const moodle = window;
  return moodle.M?.cfg?.sesskey ?? "";
}
__name(getSesskey, "getSesskey");
function SourceManager({ contextid }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [createScope, setCreateScope] = useState(null);
  const [newDocument, setNewDocument] = useState({ id: 0, name: "", description: "", content: "" });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importCourseId, setImportCourseId] = useState(0);
  const [importables, setImportables] = useState([]);
  const [selectedImportKeys, setSelectedImportKeys] = useState(/* @__PURE__ */ new Set());
  const plusIcon = /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-plus", "aria-hidden": "true" }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 166,
    columnNumber: 22
  }, this);
  const hasActiveTasks = useMemo(() => {
    if (!payload) {
      return false;
    }
    const modulesActive = payload.modules.some((row) => isActiveStatus(row.indexstatus) && row.progressrecordid > 0);
    const globalActive = payload.globaldocuments.some((row) => isActiveStatus(row.indexstatus) && row.progressrecordid > 0);
    const courseActive = payload.coursedocuments.some((row) => isActiveStatus(row.indexstatus) && row.progressrecordid > 0);
    return modulesActive || globalActive || courseActive;
  }, [payload]);
  const loadPayload = /* @__PURE__ */ __name(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await Fetch.performGet("local_ai_content", `sourcemanagement/${contextid}`);
      const data = await res.json();
      setPayload(data);
    } catch {
      setError("Die Quellen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, "loadPayload");
  useEffect(() => {
    loadPayload();
  }, [contextid]);
  useEffect(() => {
    let timer = null;
    if (hasActiveTasks) {
      timer = window.setInterval(() => {
        void loadPayload();
      }, 5e3);
    }
    return () => {
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [hasActiveTasks]);
  const executeAction = /* @__PURE__ */ __name(async (actionPayload) => {
    setSaving(true);
    setError(null);
    try {
      const res = await Fetch.request("local_ai_content", `sourcemanagement/${contextid}`, {
        method: "POST",
        params: { sesskey: getSesskey() },
        body: { ...actionPayload, sesskey: getSesskey() }
      });
      if (!res.ok) {
        setError(`Speichern fehlgeschlagen (HTTP ${res.status}).`);
        return null;
      }
      return res.json();
    } catch {
      setError("Die Aktion konnte nicht ausgef\xFChrt werden.");
      return null;
    } finally {
      setSaving(false);
    }
  }, "executeAction");
  const executeAndRefresh = /* @__PURE__ */ __name(async (actionPayload) => {
    const data = await executeAction(actionPayload);
    if (data) {
      setPayload(data);
    }
  }, "executeAndRefresh");
  const handleModuleEnabledToggle = /* @__PURE__ */ __name(async (row, enabled) => {
    await executeAndRefresh({ action: "toggle_module_enabled", cmid: row.cmid, enabled });
  }, "handleModuleEnabledToggle");
  const handleModuleAllowIndexToggle = /* @__PURE__ */ __name(async (row, allowindex) => {
    await executeAndRefresh({ action: "toggle_module_allowindex", cmid: row.cmid, allowindex });
  }, "handleModuleAllowIndexToggle");
  const openCreateModal = /* @__PURE__ */ __name((scope) => {
    setError(null);
    setCreateScope(scope);
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
    await executeAndRefresh({
      action: "create_document",
      scope: createScope,
      name: newDocument.name,
      description: newDocument.description,
      content: newDocument.content
    });
    setCreateScope(null);
  }, "handleCreateDocument");
  const handleUpdateDocument = /* @__PURE__ */ __name(async () => {
    if (!editingDocument) {
      return;
    }
    await executeAndRefresh({
      action: "update_document",
      sourceid: editingDocument.id,
      name: editingDocument.name,
      description: editingDocument.description,
      content: editingDocument.content
    });
    setEditingDocument(null);
  }, "handleUpdateDocument");
  const handleDeleteDocument = /* @__PURE__ */ __name(async (sourceid) => {
    await executeAndRefresh({ action: "delete_source", sourceid });
  }, "handleDeleteDocument");
  const openImportModal = /* @__PURE__ */ __name(() => {
    setError(null);
    setImportModalOpen(true);
    setImportStep(1);
    setImportCourseId(0);
    setImportables([]);
    setSelectedImportKeys(/* @__PURE__ */ new Set());
  }, "openImportModal");
  const closeImportModal = /* @__PURE__ */ __name(() => {
    setImportModalOpen(false);
    setImportStep(1);
  }, "closeImportModal");
  const loadImportables = /* @__PURE__ */ __name(async () => {
    if (!importCourseId) {
      setError("Bitte zuerst einen Kurs ausw\xE4hlen.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await Fetch.performGet("local_ai_content", `sourcemanagement/${contextid}/importables/${importCourseId}`);
      const data = await res.json();
      setImportables(data.importables ?? []);
      setSelectedImportKeys(/* @__PURE__ */ new Set());
      setImportStep(2);
    } catch {
      setError("Die Aktivit\xE4ten und Dokumente konnten nicht geladen werden.");
    } finally {
      setSaving(false);
    }
  }, "loadImportables");
  const toggleImportKey = /* @__PURE__ */ __name((key) => {
    setSelectedImportKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, "toggleImportKey");
  const submitImport = /* @__PURE__ */ __name(async () => {
    if (!importCourseId || selectedImportKeys.size === 0) {
      setError("Bitte mindestens eine Quelle zum Hinzuf\xFCgen ausw\xE4hlen.");
      return;
    }
    await executeAndRefresh({
      action: "import_sources",
      sourcecourseid: importCourseId,
      selectedimportkeys: [...selectedImportKeys]
    });
    closeImportModal();
  }, "submitImport");
  const renderDocumentTable = /* @__PURE__ */ __name((title, rows, canCreate, scope) => /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [
      /* @__PURE__ */ jsxDEV("h5", { className: "mb-0", children: title }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 355,
        columnNumber: 17
      }, this),
      canCreate && /* @__PURE__ */ jsxDEV(
        Button,
        {
          type: "button",
          variant: "primary",
          disabled: saving,
          onClick: () => openCreateModal(scope),
          startIcon: plusIcon,
          label: "Dokument anlegen"
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 357,
          columnNumber: 21
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 354,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-striped", children: [
      /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
        /* @__PURE__ */ jsxDEV("th", { children: "Name" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 370,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Beschreibung" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 371,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 372,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 373,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("th", { children: "Aktionen" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 374,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 369,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 368,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("tbody", { children: [
        rows.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 380,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: row.description || "-" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 381,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: [
            /* @__PURE__ */ jsxDEV("span", { className: "badge badge-light", children: row.indexstatuslabel }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 383,
              columnNumber: 33
            }, this),
            row.progressrecordid > 0 && isActiveStatus(row.indexstatus) && /* @__PURE__ */ jsxDEV(
              StoredProgress,
              {
                percent: row.progresspercent,
                message: row.progressmessage,
                error: row.progresserror
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 385,
                columnNumber: 37
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 382,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: formatTimestamp(row.lastindexed) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 392,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("td", { children: row.canedit && /* @__PURE__ */ jsxDEV("div", { className: "d-flex gap-1", children: [
            /* @__PURE__ */ jsxDEV(
              Button,
              {
                type: "button",
                variant: "secondary",
                disabled: saving,
                onClick: () => setEditingDocument({
                  id: row.id,
                  name: row.name,
                  description: row.description,
                  content: row.content
                }),
                label: "Bearbeiten"
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 396,
                columnNumber: 41
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              Button,
              {
                type: "button",
                variant: "danger",
                disabled: saving,
                onClick: () => handleDeleteDocument(row.id),
                label: "L\xF6schen"
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 408,
                columnNumber: 41
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 395,
            columnNumber: 37
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 393,
            columnNumber: 29
          }, this)
        ] }, row.id, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 379,
          columnNumber: 25
        }, this)),
        rows.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 5, className: "text-muted", children: "Keine Dokumente vorhanden." }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 422,
          columnNumber: 29
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 421,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 377,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 367,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 353,
    columnNumber: 9
  }, this), "renderDocumentTable");
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager local-ai-content-source-manager--loading", children: "Lade Quellen..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 431,
      columnNumber: 16
    }, this);
  }
  if (!payload) {
    return /* @__PURE__ */ jsxDEV("div", { className: "text-danger", children: "Keine Daten verf\xFCgbar." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 435,
      columnNumber: 16
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "local-ai-content-source-manager", children: [
    renderDocumentTable(
      "Globale Dokumente (Systemkontext)",
      payload.globaldocuments,
      payload.canmanagesystemsources,
      "global"
    ),
    renderDocumentTable("Dokumente dieses Kurses", payload.coursedocuments, true, "course"),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [
        /* @__PURE__ */ jsxDEV("h5", { className: "mb-0", children: "Dokumente aus anderen Kursen" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 451,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV(
          Button,
          {
            type: "button",
            variant: "primary",
            disabled: saving,
            onClick: openImportModal,
            startIcon: plusIcon,
            label: "Hinzuf\xFCgen"
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 452,
            columnNumber: 21
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 450,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted", children: "Quellen aus anderen Kursen werden nicht automatisch gelistet und m\xFCssen explizit hinzugef\xFCgt werden." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 461,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 449,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("h5", { children: "Aktivit\xE4ten dieses Kurses" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 467,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-hover", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { children: "Aktivit\xE4t" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 471,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Typ" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 472,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "F\xFCr KI-Zugriff aktiv" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 473,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "In Vektorstore indizieren" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 474,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 475,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("th", { children: "Last indexed" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 476,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 470,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 469,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          payload.modules.map((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: row.name }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 482,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: row.moddisplayname || row.modname }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 483,
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
                lineNumber: 486,
                columnNumber: 41
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 485,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 484,
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
                lineNumber: 500,
                columnNumber: 41
              },
              this
            ) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 499,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 498,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: [
              /* @__PURE__ */ jsxDEV("span", { className: "badge badge-light", children: row.indexstatuslabel }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 513,
                columnNumber: 37
              }, this),
              row.progressrecordid > 0 && isActiveStatus(row.indexstatus) && /* @__PURE__ */ jsxDEV(
                StoredProgress,
                {
                  percent: row.progresspercent,
                  message: row.progressmessage,
                  error: row.progresserror
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 515,
                  columnNumber: 41
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 512,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: formatTimestamp(row.lastindexed) }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 522,
              columnNumber: 33
            }, this)
          ] }, row.cmid, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 481,
            columnNumber: 29
          }, this)),
          payload.modules.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 6, className: "text-muted", children: "Keine unterst\xFCtzten Aktivit\xE4ten gefunden." }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 527,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 526,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 479,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 468,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted", children: "Hier werden nur Aktivit\xE4ten angezeigt, deren Typ aktuell vom Plugin unterst\xFCtzt wird." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 532,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 466,
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
                lineNumber: 548,
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
                    lineNumber: 556,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 549,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 547,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 561,
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
                    lineNumber: 562,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 560,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 569,
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
                    lineNumber: 570,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 568,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 577,
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
                    lineNumber: 578,
                    columnNumber: 41
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 576,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 559,
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
                  lineNumber: 587,
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
                  lineNumber: 594,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 586,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 546,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 545,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 539,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeCreateModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 605,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 538,
      columnNumber: 17
    }, this),
    importModalOpen && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "modal fade show d-block",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "source-import-modal-title",
          children: /* @__PURE__ */ jsxDEV("div", { className: "modal-dialog modal-lg modal-dialog-scrollable", role: "document", children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
              /* @__PURE__ */ jsxDEV("h5", { id: "source-import-modal-title", className: "modal-title", children: "Quellen aus anderen Kursen hinzuf\xFCgen" }, void 0, false, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 620,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "close",
                  "aria-label": "Close",
                  onClick: closeImportModal,
                  disabled: saving,
                  children: /* @__PURE__ */ jsxDEV("span", { "aria-hidden": "true", children: "\xD7" }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 630,
                    columnNumber: 41
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 623,
                  columnNumber: 37
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 619,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
              importStep === 1 && /* @__PURE__ */ jsxDEV("div", { className: "form-group mb-0", children: [
                /* @__PURE__ */ jsxDEV("label", { htmlFor: "source-import-course-select", children: "Kurs ausw\xE4hlen" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 636,
                  columnNumber: 45
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "select",
                  {
                    id: "source-import-course-select",
                    className: "custom-select",
                    value: importCourseId,
                    onChange: (e) => setImportCourseId(parseInt(e.target.value, 10) || 0),
                    children: [
                      /* @__PURE__ */ jsxDEV("option", { value: 0, children: "Bitte Kurs w\xE4hlen" }, void 0, false, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 643,
                        columnNumber: 49
                      }, this),
                      payload.importablecourses.map((course) => /* @__PURE__ */ jsxDEV("option", { value: course.id, children: [
                        course.name,
                        " (",
                        course.shortname,
                        ")"
                      ] }, course.id, true, {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 645,
                        columnNumber: 53
                      }, this))
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 637,
                    columnNumber: 45
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 635,
                columnNumber: 41
              }, this),
              importStep === 2 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mb-2", children: "Verf\xFCgbare Dokumente und Aktivit\xE4ten im gew\xE4hlten Kurs:" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 654,
                  columnNumber: 45
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "border rounded p-2", style: { maxHeight: "320px", overflowY: "auto" }, children: [
                  importables.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "small text-muted", children: "Keine importierbaren Quellen gefunden." }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 659,
                    columnNumber: 53
                  }, this),
                  importables.map((item) => /* @__PURE__ */ jsxDEV("div", { className: "form-check mb-1", children: [
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        id: `importable-${item.key}`,
                        className: "form-check-input",
                        type: "checkbox",
                        checked: selectedImportKeys.has(item.key),
                        onChange: () => toggleImportKey(item.key)
                      },
                      void 0,
                      false,
                      {
                        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                        lineNumber: 663,
                        columnNumber: 57
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV("label", { htmlFor: `importable-${item.key}`, className: "form-check-label", children: [
                      item.name,
                      item.meta ? ` (${item.meta})` : ""
                    ] }, void 0, true, {
                      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                      lineNumber: 670,
                      columnNumber: 57
                    }, this)
                  ] }, item.key, true, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 662,
                    columnNumber: 53
                  }, this))
                ] }, void 0, true, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 657,
                  columnNumber: 45
                }, this)
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 653,
                columnNumber: 41
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 633,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "modal-footer", children: [
              importStep === 2 && /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "secondary",
                  disabled: saving,
                  onClick: () => setImportStep(1),
                  label: "Zur\xFCck"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 682,
                  columnNumber: 41
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "secondary",
                  disabled: saving,
                  onClick: closeImportModal,
                  label: "Abbrechen"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 690,
                  columnNumber: 37
                },
                this
              ),
              importStep === 1 && /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "primary",
                  disabled: saving || !importCourseId,
                  onClick: loadImportables,
                  label: "Weiter"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 698,
                  columnNumber: 41
                },
                this
              ),
              importStep === 2 && /* @__PURE__ */ jsxDEV(
                Button,
                {
                  type: "button",
                  variant: "primary",
                  disabled: saving || selectedImportKeys.size === 0,
                  onClick: submitImport,
                  label: "Auswahl hinzuf\xFCgen"
                },
                void 0,
                false,
                {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 707,
                  columnNumber: 41
                },
                this
              )
            ] }, void 0, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 680,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 618,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 617,
            columnNumber: 25
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 611,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop fade show", onClick: closeImportModal }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 719,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 610,
      columnNumber: 17
    }, this),
    editingDocument && /* @__PURE__ */ jsxDEV("div", { className: "border rounded p-3 mb-3", children: [
      /* @__PURE__ */ jsxDEV("h6", { className: "mb-2", children: "Dokument bearbeiten" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 725,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { children: "Name" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 727,
          columnNumber: 25
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
            lineNumber: 728,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 726,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { children: "Beschreibung" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 735,
          columnNumber: 25
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
            lineNumber: 736,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 734,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { children: "Inhalt" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 743,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV(
          "textarea",
          {
            className: "form-control form-control-sm",
            rows: 5,
            value: editingDocument.content,
            onChange: (e) => setEditingDocument({ ...editingDocument, content: e.target.value })
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 744,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 742,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex gap-2", children: [
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
            lineNumber: 752,
            columnNumber: 25
          },
          this
        ),
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
            lineNumber: 759,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 751,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 724,
      columnNumber: 17
    }, this),
    error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 770,
      columnNumber: 23
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 439,
    columnNumber: 9
  }, this);
}
__name(SourceManager, "SourceManager");
export {
  SourceManager as default
};
//# sourceMappingURL=source_manager.dev.js.map

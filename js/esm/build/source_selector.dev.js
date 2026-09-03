var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
/**
 * React component for selecting sources for a given context.
 *
 * @module     local_ai_content/source_selector
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Fetch from "@moodle/lms/core/fetch";
import { Checkbox } from "@moodlehq/design-system";
import {
  closeSourceSelectorModal,
  openSourceSelectorModal
} from "./source_selector/source_selection_modal_manager";
const SOURCE_SELECTOR_API_KEY = "localAiContentSourceSelectorApi";
function getSourceSelectorApi() {
  const scope = window;
  const existing = scope[SOURCE_SELECTOR_API_KEY];
  if (existing && typeof existing.setSelectedSourceIds === "function" && typeof existing.getSelectedSourceIds === "function" && typeof existing.subscribe === "function" && typeof existing.unsubscribe === "function") {
    return existing;
  }
  return null;
}
__name(getSourceSelectorApi, "getSourceSelectorApi");
function publishSelected(contextId, selectedSourceIds) {
  const sourceSelectorApi = getSourceSelectorApi();
  if (!sourceSelectorApi) {
    return;
  }
  sourceSelectorApi.setSelectedSourceIds(contextId, Array.from(parseIds(selectedSourceIds)));
}
__name(publishSelected, "publishSelected");
function parseIds(raw) {
  if (!raw) {
    return /* @__PURE__ */ new Set();
  }
  return new Set(
    raw.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0)
  );
}
__name(parseIds, "parseIds");
function getSourceMeta(source) {
  return source.sourcetype ?? "";
}
__name(getSourceMeta, "getSourceMeta");
function SourceListSection({
  contextId,
  sources,
  sectionTitle,
  emptyText,
  selected,
  saving,
  onToggle,
  onRemove
}) {
  return /* @__PURE__ */ jsxDEV("section", { className: "mb-3", children: [
    /* @__PURE__ */ jsxDEV("h6", { className: "mb-2", children: sectionTitle }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 187,
      columnNumber: 13
    }, this),
    sources.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small", children: emptyText }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 188,
      columnNumber: 38
    }, this),
    sources.length > 0 && /* @__PURE__ */ jsxDEV("ul", { className: "source-selector__list list-unstyled mb-0", children: sources.map((source) => /* @__PURE__ */ jsxDEV("li", { className: "source-selector__item mb-1", children: /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-start gap-2", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex-grow-1", children: /* @__PURE__ */ jsxDEV(
        Checkbox,
        {
          id: `source-selector-source-${contextId}-${source.id}`,
          checked: selected.has(source.id),
          onChange: () => onToggle(source.id),
          label: source.name,
          supportingText: getSourceMeta(source)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 195,
          columnNumber: 37
        },
        this
      ) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 194,
        columnNumber: 33
      }, this),
      onRemove && /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "btn btn-link btn-sm p-0 text-muted",
          title: "Quelle entfernen",
          "aria-label": `Quelle ${source.name} entfernen`,
          onClick: () => onRemove(source.id),
          disabled: saving,
          children: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-unlink", "aria-hidden": "true" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 212,
            columnNumber: 41
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 204,
          columnNumber: 37
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 193,
      columnNumber: 29
    }, this) }, source.id, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 192,
      columnNumber: 25
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 190,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 186,
    columnNumber: 9
  }, this);
}
__name(SourceListSection, "SourceListSection");
function ImportListSection({
  contextId,
  sources,
  sectionTitle,
  emptyText,
  stagedSelection,
  onToggle
}) {
  return /* @__PURE__ */ jsxDEV("section", { className: "mb-3", children: [
    /* @__PURE__ */ jsxDEV("h6", { className: "mb-2", children: sectionTitle }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 240,
      columnNumber: 13
    }, this),
    sources.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small", children: emptyText }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 241,
      columnNumber: 38
    }, this),
    sources.length > 0 && /* @__PURE__ */ jsxDEV("ul", { className: "source-selector__list list-unstyled mb-0", children: sources.map((source) => /* @__PURE__ */ jsxDEV("li", { className: "source-selector__item mb-1", children: /* @__PURE__ */ jsxDEV(
      Checkbox,
      {
        id: `source-selector-import-source-${contextId}-${source.id}`,
        checked: stagedSelection.has(source.id),
        onChange: () => onToggle(source.id),
        label: source.name,
        supportingText: getSourceMeta(source)
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 246,
        columnNumber: 29
      },
      this
    ) }, source.id, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 245,
      columnNumber: 25
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 243,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 239,
    columnNumber: 9
  }, this);
}
__name(ImportListSection, "ImportListSection");
function SourceSelector({
  contextId,
  buttonTitle = "Kontextquellen ausw\xE4hlen",
  modalTitle = "Kontextquellen ausw\xE4hlen"
}) {
  const [globalDocuments, setGlobalDocuments] = useState([]);
  const [courseActivities, setCourseActivities] = useState([]);
  const [externalSources, setExternalSources] = useState([]);
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [mode, setMode] = useState("main");
  const [importableCourses, setImportableCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(0);
  const [importCourseActivities, setImportCourseActivities] = useState([]);
  const [importCourseDocuments, setImportCourseDocuments] = useState([]);
  const [stagedImportSelection, setStagedImportSelection] = useState(/* @__PURE__ */ new Set());
  const [loading, setLoading] = useState(true);
  const [loadingImportView, setLoadingImportView] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBodyRoot, setModalBodyRoot] = useState(null);
  const modalRef = useRef(null);
  useEffect(() => {
    setLoading(true);
    setError(null);
    Fetch.performGet("local_ai_content", `contexts/${contextId}/source-selections`).then((res) => res.json()).then((data) => {
      const item = data.items?.[0] ?? {};
      setGlobalDocuments(item.globalDocuments ?? []);
      setCourseActivities(item.courseActivities ?? []);
      setExternalSources(item.externalSources ?? []);
      const selectedSourceIds = item.selectedSourceIds ?? "";
      setSelected(parseIds(selectedSourceIds));
      publishSelected(contextId, selectedSourceIds);
      setLoading(false);
      return data;
    }).catch(() => {
      setError("Failed to load source selection for this context.");
      setLoading(false);
    });
  }, [contextId]);
  const handleToggle = /* @__PURE__ */ __name((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSaveSuccess(false);
  }, "handleToggle");
  const handleImportToggle = /* @__PURE__ */ __name((id) => {
    setStagedImportSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, "handleImportToggle");
  const handleRemoveExternalSource = /* @__PURE__ */ __name((id) => {
    setExternalSources((prev) => prev.filter((source) => source.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSaveSuccess(false);
  }, "handleRemoveExternalSource");
  const loadImportableCourses = /* @__PURE__ */ __name(async () => {
    setLoadingImportView(true);
    setError(null);
    try {
      const res = await Fetch.performGet("local_ai_content", `contexts/${contextId}/source-selections/importable-courses`);
      const data = await res.json();
      const courses = data.items ?? [];
      setImportableCourses(courses);
      setSelectedCourseId(courses[0]?.id ?? 0);
    } catch {
      setError("Die ausw\xE4hlbaren Kurse konnten nicht geladen werden.");
    } finally {
      setLoadingImportView(false);
    }
  }, "loadImportableCourses");
  const openCourseSelection = /* @__PURE__ */ __name(async () => {
    setMode("courses");
    setImportCourseActivities([]);
    setImportCourseDocuments([]);
    setStagedImportSelection(/* @__PURE__ */ new Set());
    await loadImportableCourses();
  }, "openCourseSelection");
  const loadImportableSources = /* @__PURE__ */ __name(async () => {
    if (selectedCourseId <= 0) {
      return;
    }
    setLoadingImportView(true);
    setError(null);
    try {
      const res = await Fetch.performGet(
        "local_ai_content",
        `contexts/${contextId}/source-selections/importable-sources?sourceCourseId=${selectedCourseId}`
      );
      const data = await res.json();
      const item = data.items?.[0] ?? {};
      const existingExternalIds = new Set(externalSources.map((source) => source.id));
      const activities = (item.courseActivities ?? []).filter((source) => !existingExternalIds.has(source.id));
      const documents = (item.courseDocuments ?? []).filter((source) => !existingExternalIds.has(source.id));
      const nextStaged = /* @__PURE__ */ new Set();
      [...activities, ...documents].forEach((source) => {
        if (selected.has(source.id)) {
          nextStaged.add(source.id);
        }
      });
      setImportCourseActivities(activities);
      setImportCourseDocuments(documents);
      setStagedImportSelection(nextStaged);
      setMode("sources");
    } catch {
      setError("Die Quellen des ausgew\xE4hlten Kurses konnten nicht geladen werden.");
    } finally {
      setLoadingImportView(false);
    }
  }, "loadImportableSources");
  const addSelectedExternalSources = /* @__PURE__ */ __name(() => {
    const importableSources = [...importCourseActivities, ...importCourseDocuments];
    const byId = /* @__PURE__ */ new Map();
    importableSources.forEach((source) => byId.set(source.id, source));
    setSelected((prev) => {
      const next = new Set(prev);
      stagedImportSelection.forEach((id) => next.add(id));
      return next;
    });
    setExternalSources((prev) => {
      const existingIds = new Set(prev.map((source) => source.id));
      const localIds = new Set([...globalDocuments, ...courseActivities].map((source) => source.id));
      const next = [...prev];
      stagedImportSelection.forEach((id) => {
        if (existingIds.has(id) || localIds.has(id)) {
          return;
        }
        const source = byId.get(id);
        if (!source) {
          return;
        }
        next.push(source);
      });
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setMode("main");
    setSaveSuccess(false);
  }, "addSelectedExternalSources");
  const handleSave = /* @__PURE__ */ __name(async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    const selectedSourceIds = [...selected].join(",");
    publishSelected(contextId, selectedSourceIds);
    const response = await Fetch.request("local_ai_content", `contexts/${contextId}/source-selections`, {
      method: "PUT",
      body: {
        selectedSourceIds
      }
    });
    if (!response.ok) {
      setError(`Failed to save source selection for this context (HTTP ${response.status}).`);
      setSaving(false);
      return;
    }
    setSaveSuccess(true);
    setSaving(false);
  }, "handleSave");
  useEffect(() => {
    publishSelected(contextId, [...selected].join(","));
  }, [contextId, selected]);
  useEffect(() => {
    return () => {
      if (modalRef.current) {
        closeSourceSelectorModal(modalRef.current);
        modalRef.current = null;
      }
    };
  }, []);
  const openModal = /* @__PURE__ */ __name(async () => {
    if (modalRef.current) {
      return;
    }
    try {
      const modalResult = await openSourceSelectorModal({
        title: modalTitle,
        onShown: /* @__PURE__ */ __name(() => {
          setIsModalOpen(true);
        }, "onShown"),
        onHidden: /* @__PURE__ */ __name(() => {
          setIsModalOpen(false);
          setModalBodyRoot(null);
          modalRef.current = null;
        }, "onHidden")
      });
      if (!modalResult) {
        return;
      }
      modalRef.current = modalResult.modal;
      setModalBodyRoot(modalResult.bodyRoot);
    } catch {
      setIsModalOpen(false);
      setModalBodyRoot(null);
      modalRef.current = null;
    }
  }, "openModal");
  const renderCoursesContent = /* @__PURE__ */ __name(() => /* @__PURE__ */ jsxDEV("div", { className: "source-selector", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [
      /* @__PURE__ */ jsxDEV("h6", { className: "mb-0", children: "Fremdkurs ausw\xE4hlen" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 515,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "btn btn-link btn-sm p-0",
          onClick: () => setMode("main"),
          disabled: loadingImportView || saving,
          children: "Zur\xFCck"
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 516,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 514,
      columnNumber: 13
    }, this),
    loadingImportView && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-2", children: "Lade Kurse..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 526,
      columnNumber: 35
    }, this),
    !loadingImportView && importableCourses.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-2", children: "Keine weiteren Kurse mit nutzbaren Quellen gefunden." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 528,
      columnNumber: 17
    }, this),
    !loadingImportView && importableCourses.length > 0 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: `source-selector-import-course-${contextId}`, children: "Kurs" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 533,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV(
          "select",
          {
            id: `source-selector-import-course-${contextId}`,
            className: "custom-select",
            value: selectedCourseId,
            onChange: (event) => setSelectedCourseId(parseInt(event.target.value, 10) || 0),
            disabled: saving,
            children: importableCourses.map((course) => /* @__PURE__ */ jsxDEV("option", { value: course.id, children: course.name }, course.id, false, {
              fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
              lineNumber: 542,
              columnNumber: 33
            }, this))
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 534,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 532,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "btn btn-primary btn-sm",
          onClick: loadImportableSources,
          disabled: selectedCourseId <= 0 || saving || loadingImportView,
          children: "Quellen laden"
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 546,
          columnNumber: 21
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 531,
      columnNumber: 17
    }, this),
    error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 557,
      columnNumber: 23
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 513,
    columnNumber: 9
  }, this), "renderCoursesContent");
  const renderImportSourcesContent = /* @__PURE__ */ __name(() => /* @__PURE__ */ jsxDEV("div", { className: "source-selector source-selector--empty", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [
      /* @__PURE__ */ jsxDEV("h6", { className: "mb-0", children: "Quellen aus Fremdkurs hinzuf\xFCgen" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 564,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "btn btn-link btn-sm p-0",
          onClick: () => setMode("courses"),
          disabled: loadingImportView || saving,
          children: "Kurs wechseln"
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 565,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 563,
      columnNumber: 13
    }, this),
    loadingImportView && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small", children: "Lade Quellen..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 575,
      columnNumber: 35
    }, this),
    !loadingImportView && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(
        ImportListSection,
        {
          contextId,
          sources: importCourseDocuments,
          sectionTitle: "Kursdokumente",
          emptyText: "Keine Kursdokumente verf\xFCgbar.",
          stagedSelection: stagedImportSelection,
          onToggle: handleImportToggle
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 578,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        ImportListSection,
        {
          contextId,
          sources: importCourseActivities,
          sectionTitle: "Kursaktivit\xE4ten",
          emptyText: "Keine Kursaktivit\xE4ten verf\xFCgbar.",
          stagedSelection: stagedImportSelection,
          onToggle: handleImportToggle
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 586,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex gap-2 mt-3", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            className: "btn btn-secondary btn-sm",
            onClick: () => setMode("main"),
            disabled: saving,
            children: "Abbrechen"
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 596,
            columnNumber: 25
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            className: "btn btn-primary btn-sm",
            onClick: addSelectedExternalSources,
            disabled: saving || stagedImportSelection.size === 0,
            children: "Hinzuf\xFCgen"
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 604,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 595,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 577,
      columnNumber: 17
    }, this),
    error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 616,
      columnNumber: 23
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 562,
    columnNumber: 9
  }, this), "renderImportSourcesContent");
  const renderMainContent = /* @__PURE__ */ __name(() => /* @__PURE__ */ jsxDEV("div", { className: "source-selector", children: [
    /* @__PURE__ */ jsxDEV(
      SourceListSection,
      {
        contextId,
        sources: globalDocuments,
        sectionTitle: "Globale Dokumente",
        emptyText: "Keine globalen Dokumente verf\xFCgbar.",
        selected,
        saving,
        onToggle: handleToggle
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 622,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      SourceListSection,
      {
        contextId,
        sources: courseActivities,
        sectionTitle: "Kursaktivit\xE4ten",
        emptyText: "Keine Kursaktivit\xE4ten verf\xFCgbar.",
        selected,
        saving,
        onToggle: handleToggle
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 631,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      SourceListSection,
      {
        contextId,
        sources: externalSources,
        sectionTitle: "Externe Quellen",
        emptyText: "Keine externen Quellen hinzugef\xFCgt.",
        selected,
        saving,
        onToggle: handleToggle,
        onRemove: handleRemoveExternalSource
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 640,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "mb-3", children: /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        className: "btn btn-outline-secondary btn-sm",
        onClick: openCourseSelection,
        disabled: saving || loadingImportView,
        children: [
          /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-plus mr-1", "aria-hidden": "true" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 658,
            columnNumber: 21
          }, this),
          "Quelle hinzuf\xFCgen"
        ]
      },
      void 0,
      true,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 652,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 651,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "source-selector__actions mt-2 d-flex align-items-center gap-3", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "btn btn-primary btn-sm",
          onClick: handleSave,
          disabled: saving,
          children: "Speichern"
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 664,
          columnNumber: 17
        },
        this
      ),
      saving && /* @__PURE__ */ jsxDEV("span", { className: "text-muted small", children: "Speichere..." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 673,
        columnNumber: 21
      }, this),
      saveSuccess && /* @__PURE__ */ jsxDEV("span", { className: "text-success small", children: "Gespeichert" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 677,
        columnNumber: 21
      }, this),
      error && /* @__PURE__ */ jsxDEV("span", { className: "text-danger small", children: error }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 681,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 663,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 621,
    columnNumber: 9
  }, this), "renderMainContent");
  const renderSelectorContent = /* @__PURE__ */ __name(() => {
    if (loading) {
      return /* @__PURE__ */ jsxDEV("div", { className: "source-selector source-selector--loading", children: "Lade Quellen..." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 689,
        columnNumber: 20
      }, this);
    }
    if (mode === "courses") {
      return renderCoursesContent();
    }
    if (mode === "sources") {
      return renderImportSourcesContent();
    }
    return renderMainContent();
  }, "renderSelectorContent");
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        className: "btn btn-icon icon-no-margin p-0",
        title: buttonTitle,
        "aria-label": buttonTitle,
        onClick: openModal,
        children: /* @__PURE__ */ jsxDEV("i", { className: "fa fa-paperclip", "aria-hidden": "true" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 712,
          columnNumber: 17
        }, this)
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 705,
        columnNumber: 13
      },
      this
    ),
    isModalOpen && modalBodyRoot && createPortal(renderSelectorContent(), modalBodyRoot)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 704,
    columnNumber: 9
  }, this);
}
__name(SourceSelector, "SourceSelector");
export {
  SourceSelector as default
};
//# sourceMappingURL=source_selector.dev.js.map

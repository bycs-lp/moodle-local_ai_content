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
import {
  loadSourceSelection,
  saveSelectedSourceIds
} from "./source_selector/data_manager";
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
      lineNumber: 115,
      columnNumber: 13
    }, this),
    sources.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small", children: emptyText }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 116,
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
          lineNumber: 123,
          columnNumber: 37
        },
        this
      ) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 122,
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
            lineNumber: 140,
            columnNumber: 41
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 132,
          columnNumber: 37
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 121,
      columnNumber: 29
    }, this) }, source.id, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 120,
      columnNumber: 25
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 118,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 114,
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
      lineNumber: 168,
      columnNumber: 13
    }, this),
    sources.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small", children: emptyText }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 169,
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
        lineNumber: 174,
        columnNumber: 29
      },
      this
    ) }, source.id, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 173,
      columnNumber: 25
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 171,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 167,
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
  const pendingSaves = useRef(0);
  const loadSelection = /* @__PURE__ */ __name((reload) => {
    setLoading(true);
    setError(null);
    loadSourceSelection(contextId, reload).then((selection) => {
      setGlobalDocuments(selection.globalDocuments);
      setCourseActivities(selection.courseActivities);
      setExternalSources(selection.externalSources);
      setSelected(new Set(selection.selectedSourceIds));
      setLoading(false);
      return selection;
    }).catch(() => {
      setError("Failed to load source selection for this context.");
      setLoading(false);
    });
  }, "loadSelection");
  useEffect(() => {
    loadSelection(false);
  }, [contextId]);
  const updateSelection = /* @__PURE__ */ __name(async (next) => {
    setSelected(next);
    setSaveSuccess(false);
    setError(null);
    setSaving(true);
    pendingSaves.current++;
    try {
      await saveSelectedSourceIds(contextId, [...next]);
      setSaveSuccess(true);
    } catch {
      setError("Failed to save source selection for this context.");
      try {
        const selection = await loadSourceSelection(contextId, true);
        setExternalSources(selection.externalSources);
        setSelected(new Set(selection.selectedSourceIds));
      } catch {
      }
    } finally {
      pendingSaves.current--;
      if (pendingSaves.current === 0) {
        setSaving(false);
      }
    }
  }, "updateSelection");
  const handleToggle = /* @__PURE__ */ __name((id) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    updateSelection(next);
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
    const next = new Set(selected);
    next.delete(id);
    updateSelection(next);
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
    updateSelection(/* @__PURE__ */ new Set([...selected, ...stagedImportSelection]));
  }, "addSelectedExternalSources");
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
    if (pendingSaves.current === 0) {
      loadSelection(true);
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
        lineNumber: 445,
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
          lineNumber: 446,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 444,
      columnNumber: 13
    }, this),
    loadingImportView && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-2", children: "Lade Kurse..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 456,
      columnNumber: 35
    }, this),
    !loadingImportView && importableCourses.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-2", children: "Keine weiteren Kurse mit nutzbaren Quellen gefunden." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 458,
      columnNumber: 17
    }, this),
    !loadingImportView && importableCourses.length > 0 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: `source-selector-import-course-${contextId}`, children: "Kurs" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 463,
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
              lineNumber: 472,
              columnNumber: 33
            }, this))
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 464,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 462,
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
          lineNumber: 476,
          columnNumber: 21
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 461,
      columnNumber: 17
    }, this),
    error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 487,
      columnNumber: 23
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 443,
    columnNumber: 9
  }, this), "renderCoursesContent");
  const renderImportSourcesContent = /* @__PURE__ */ __name(() => /* @__PURE__ */ jsxDEV("div", { className: "source-selector source-selector--empty", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [
      /* @__PURE__ */ jsxDEV("h6", { className: "mb-0", children: "Quellen aus Fremdkurs hinzuf\xFCgen" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 494,
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
          lineNumber: 495,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 493,
      columnNumber: 13
    }, this),
    loadingImportView && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small", children: "Lade Quellen..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 505,
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
          lineNumber: 508,
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
          lineNumber: 516,
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
            lineNumber: 526,
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
            lineNumber: 534,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 525,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 507,
      columnNumber: 17
    }, this),
    error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 546,
      columnNumber: 23
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 492,
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
        lineNumber: 552,
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
        lineNumber: 561,
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
        lineNumber: 570,
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
            lineNumber: 588,
            columnNumber: 21
          }, this),
          "Quelle hinzuf\xFCgen"
        ]
      },
      void 0,
      true,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 582,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 581,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "source-selector__actions mt-2 d-flex align-items-center gap-3", children: [
      saving && /* @__PURE__ */ jsxDEV("span", { className: "text-muted small", children: "Speichere..." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 595,
        columnNumber: 21
      }, this),
      saveSuccess && /* @__PURE__ */ jsxDEV("span", { className: "text-success small", children: "Gespeichert" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 599,
        columnNumber: 21
      }, this),
      error && /* @__PURE__ */ jsxDEV("span", { className: "text-danger small", children: error }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 603,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 593,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 551,
    columnNumber: 9
  }, this), "renderMainContent");
  const renderSelectorContent = /* @__PURE__ */ __name(() => {
    if (loading) {
      return /* @__PURE__ */ jsxDEV("div", { className: "source-selector source-selector--loading", children: "Lade Quellen..." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 611,
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
          lineNumber: 634,
          columnNumber: 17
        }, this)
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 627,
        columnNumber: 13
      },
      this
    ),
    isModalOpen && modalBodyRoot && createPortal(renderSelectorContent(), modalBodyRoot)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 626,
    columnNumber: 9
  }, this);
}
__name(SourceSelector, "SourceSelector");
export {
  SourceSelector as default
};
//# sourceMappingURL=source_selector.dev.js.map

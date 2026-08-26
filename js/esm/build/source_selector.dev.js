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
import { useState, useEffect } from "react";
import Fetch from "@moodle/lms/core/fetch";
import { Checkbox } from "@moodlehq/design-system";
const DATA_MANAGER_KEY = "sourcesSelectionDataManager";
function getSourceSelectionDataManager() {
  const scope = window;
  const existing = scope[DATA_MANAGER_KEY];
  if (existing && typeof existing.setSelectedSourceIdsForContext === "function" && typeof existing.getSelectedSourceIdsForContext === "function") {
    return existing;
  }
  return null;
}
__name(getSourceSelectionDataManager, "getSourceSelectionDataManager");
function publishSelected(contextid, selectedsourceids) {
  const datamanager = getSourceSelectionDataManager();
  if (!datamanager) {
    return;
  }
  datamanager.setSelectedSourceIdsForContext(contextid, Array.from(parseIds(selectedsourceids)));
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
  if (source.origin && source.sourcetype) {
    return `${source.origin} \xB7 ${source.sourcetype}`;
  }
  if (source.origin) {
    return source.origin;
  }
  return source.sourcetype ?? "";
}
__name(getSourceMeta, "getSourceMeta");
function SourceListSection({
  contextid,
  sources,
  sectiontitle,
  emptytext,
  selected,
  saving,
  onToggle,
  onRemove
}) {
  return /* @__PURE__ */ jsxDEV("section", { className: "mb-3", children: [
    /* @__PURE__ */ jsxDEV("h6", { className: "mb-2", children: sectiontitle }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 182,
      columnNumber: 13
    }, this),
    sources.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small", children: emptytext }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 183,
      columnNumber: 38
    }, this),
    sources.length > 0 && /* @__PURE__ */ jsxDEV("ul", { className: "source-selector__list list-unstyled mb-0", children: sources.map((source) => /* @__PURE__ */ jsxDEV("li", { className: "source-selector__item mb-1", children: /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-start gap-2", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex-grow-1", children: /* @__PURE__ */ jsxDEV(
        Checkbox,
        {
          id: `source-selector-source-${contextid}-${source.id}`,
          checked: selected.has(source.id),
          onChange: () => onToggle(source.id),
          label: source.name,
          supportingText: getSourceMeta(source)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 190,
          columnNumber: 37
        },
        this
      ) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 189,
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
            lineNumber: 207,
            columnNumber: 41
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 199,
          columnNumber: 37
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 188,
      columnNumber: 29
    }, this) }, source.id, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 187,
      columnNumber: 25
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 185,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 181,
    columnNumber: 9
  }, this);
}
__name(SourceListSection, "SourceListSection");
function ImportListSection({
  contextid,
  sources,
  sectiontitle,
  emptytext,
  stagedselection,
  onToggle
}) {
  return /* @__PURE__ */ jsxDEV("section", { className: "mb-3", children: [
    /* @__PURE__ */ jsxDEV("h6", { className: "mb-2", children: sectiontitle }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 235,
      columnNumber: 13
    }, this),
    sources.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small", children: emptytext }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 236,
      columnNumber: 38
    }, this),
    sources.length > 0 && /* @__PURE__ */ jsxDEV("ul", { className: "source-selector__list list-unstyled mb-0", children: sources.map((source) => /* @__PURE__ */ jsxDEV("li", { className: "source-selector__item mb-1", children: /* @__PURE__ */ jsxDEV(
      Checkbox,
      {
        id: `source-selector-import-source-${contextid}-${source.id}`,
        checked: stagedselection.has(source.id),
        onChange: () => onToggle(source.id),
        label: source.name,
        supportingText: getSourceMeta(source)
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 241,
        columnNumber: 29
      },
      this
    ) }, source.id, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 240,
      columnNumber: 25
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 238,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 234,
    columnNumber: 9
  }, this);
}
__name(ImportListSection, "ImportListSection");
function SourceSelector({ contextid }) {
  const [globaldocuments, setGlobaldocuments] = useState([]);
  const [courseactivities, setCourseactivities] = useState([]);
  const [externalsources, setExternalsources] = useState([]);
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [mode, setMode] = useState("main");
  const [importablecourses, setImportablecourses] = useState([]);
  const [selectedcourseid, setSelectedcourseid] = useState(0);
  const [importcourseactivities, setImportcourseactivities] = useState([]);
  const [importcoursedocuments, setImportcoursedocuments] = useState([]);
  const [stagedimportselection, setStagedimportselection] = useState(/* @__PURE__ */ new Set());
  const [loading, setLoading] = useState(true);
  const [loadingimportview, setLoadingimportview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true);
    setError(null);
    Fetch.performGet("local_ai_content", `contexts/${contextid}/source-selections`).then((res) => res.json()).then((data) => {
      const item = data.items?.[0] ?? {};
      setGlobaldocuments(item.globalDocuments ?? []);
      setCourseactivities(item.courseActivities ?? []);
      setExternalsources(item.externalSources ?? []);
      const selectedsourceids = item.selectedSourceIds ?? "";
      setSelected(parseIds(selectedsourceids));
      publishSelected(contextid, selectedsourceids);
      setLoading(false);
      return data;
    }).catch(() => {
      setError("Failed to load source selection for this context.");
      setLoading(false);
    });
  }, [contextid]);
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
    setStagedimportselection((prev) => {
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
    setExternalsources((prev) => prev.filter((source) => source.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSaveSuccess(false);
  }, "handleRemoveExternalSource");
  const loadImportableCourses = /* @__PURE__ */ __name(async () => {
    setLoadingimportview(true);
    setError(null);
    try {
      const res = await Fetch.performGet("local_ai_content", `contexts/${contextid}/source-selections/importable-courses`);
      const data = await res.json();
      const courses = data.items ?? [];
      setImportablecourses(courses);
      setSelectedcourseid(courses[0]?.id ?? 0);
    } catch {
      setError("Die ausw\xE4hlbaren Kurse konnten nicht geladen werden.");
    } finally {
      setLoadingimportview(false);
    }
  }, "loadImportableCourses");
  const openCourseSelection = /* @__PURE__ */ __name(async () => {
    setMode("courses");
    setImportcourseactivities([]);
    setImportcoursedocuments([]);
    setStagedimportselection(/* @__PURE__ */ new Set());
    await loadImportableCourses();
  }, "openCourseSelection");
  const loadImportableSources = /* @__PURE__ */ __name(async () => {
    if (selectedcourseid <= 0) {
      return;
    }
    setLoadingimportview(true);
    setError(null);
    try {
      const res = await Fetch.performGet(
        "local_ai_content",
        `contexts/${contextid}/source-selections/importable-sources?sourceCourseId=${selectedcourseid}`
      );
      const data = await res.json();
      const item = data.items?.[0] ?? {};
      const existingexternalids = new Set(externalsources.map((source) => source.id));
      const activities = (item.courseActivities ?? []).filter((source) => !existingexternalids.has(source.id));
      const documents = (item.courseDocuments ?? []).filter((source) => !existingexternalids.has(source.id));
      const nextstaged = /* @__PURE__ */ new Set();
      [...activities, ...documents].forEach((source) => {
        if (selected.has(source.id)) {
          nextstaged.add(source.id);
        }
      });
      setImportcourseactivities(activities);
      setImportcoursedocuments(documents);
      setStagedimportselection(nextstaged);
      setMode("sources");
    } catch {
      setError("Die Quellen des ausgew\xE4hlten Kurses konnten nicht geladen werden.");
    } finally {
      setLoadingimportview(false);
    }
  }, "loadImportableSources");
  const addSelectedExternalSources = /* @__PURE__ */ __name(() => {
    const importablesources = [...importcourseactivities, ...importcoursedocuments];
    const byid = /* @__PURE__ */ new Map();
    importablesources.forEach((source) => byid.set(source.id, source));
    setSelected((prev) => {
      const next = new Set(prev);
      stagedimportselection.forEach((id) => next.add(id));
      return next;
    });
    setExternalsources((prev) => {
      const existingids = new Set(prev.map((source) => source.id));
      const localids = new Set([...globaldocuments, ...courseactivities].map((source) => source.id));
      const next = [...prev];
      stagedimportselection.forEach((id) => {
        if (existingids.has(id) || localids.has(id)) {
          return;
        }
        const source = byid.get(id);
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
    const selectedsourceids = [...selected].join(",");
    publishSelected(contextid, selectedsourceids);
    const response = await Fetch.request("local_ai_content", `contexts/${contextid}/source-selections`, {
      method: "PATCH",
      body: {
        selectedSourceIds: selectedsourceids
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
    publishSelected(contextid, [...selected].join(","));
  }, [contextid, selected]);
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "source-selector source-selector--loading", children: "Lade Quellen..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 461,
      columnNumber: 16
    }, this);
  }
  if (mode === "courses") {
    return /* @__PURE__ */ jsxDEV("div", { className: "source-selector", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [
        /* @__PURE__ */ jsxDEV("h6", { className: "mb-0", children: "Fremdkurs ausw\xE4hlen" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 468,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            className: "btn btn-link btn-sm p-0",
            onClick: () => setMode("main"),
            disabled: loadingimportview || saving,
            children: "Zur\xFCck"
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 469,
            columnNumber: 21
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 467,
        columnNumber: 17
      }, this),
      loadingimportview && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-2", children: "Lade Kurse..." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 479,
        columnNumber: 39
      }, this),
      !loadingimportview && importablecourses.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-2", children: "Keine weiteren Kurse mit nutzbaren Quellen gefunden." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 481,
        columnNumber: 21
      }, this),
      !loadingimportview && importablecourses.length > 0 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxDEV("label", { htmlFor: `source-selector-import-course-${contextid}`, children: "Kurs" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 486,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              id: `source-selector-import-course-${contextid}`,
              className: "custom-select",
              value: selectedcourseid,
              onChange: (event) => setSelectedcourseid(parseInt(event.target.value, 10) || 0),
              disabled: saving,
              children: importablecourses.map((course) => /* @__PURE__ */ jsxDEV("option", { value: course.id, children: course.name }, course.id, false, {
                fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
                lineNumber: 495,
                columnNumber: 37
              }, this))
            },
            void 0,
            false,
            {
              fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
              lineNumber: 487,
              columnNumber: 29
            },
            this
          )
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 485,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            className: "btn btn-primary btn-sm",
            onClick: loadImportableSources,
            disabled: selectedcourseid <= 0 || saving || loadingimportview,
            children: "Quellen laden"
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 499,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 484,
        columnNumber: 21
      }, this),
      error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 510,
        columnNumber: 27
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 466,
      columnNumber: 13
    }, this);
  }
  if (mode === "sources") {
    return /* @__PURE__ */ jsxDEV("div", { className: "source-selector source-selector--empty", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [
        /* @__PURE__ */ jsxDEV("h6", { className: "mb-0", children: "Quellen aus Fremdkurs hinzuf\xFCgen" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 519,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            className: "btn btn-link btn-sm p-0",
            onClick: () => setMode("courses"),
            disabled: loadingimportview || saving,
            children: "Kurs wechseln"
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 520,
            columnNumber: 21
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 518,
        columnNumber: 17
      }, this),
      loadingimportview && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small", children: "Lade Quellen..." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 530,
        columnNumber: 39
      }, this),
      !loadingimportview && /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV(
          ImportListSection,
          {
            contextid,
            sources: importcoursedocuments,
            sectiontitle: "Kursdokumente",
            emptytext: "Keine Kursdokumente verf\xFCgbar.",
            stagedselection: stagedimportselection,
            onToggle: handleImportToggle
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 533,
            columnNumber: 25
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          ImportListSection,
          {
            contextid,
            sources: importcourseactivities,
            sectiontitle: "Kursaktivit\xE4ten",
            emptytext: "Keine Kursaktivit\xE4ten verf\xFCgbar.",
            stagedselection: stagedimportselection,
            onToggle: handleImportToggle
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 541,
            columnNumber: 25
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
              lineNumber: 551,
              columnNumber: 29
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: "btn btn-primary btn-sm",
              onClick: addSelectedExternalSources,
              disabled: saving || stagedimportselection.size === 0,
              children: "Hinzuf\xFCgen"
            },
            void 0,
            false,
            {
              fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
              lineNumber: 559,
              columnNumber: 29
            },
            this
          )
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 550,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 532,
        columnNumber: 21
      }, this),
      error && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", children: error }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 571,
        columnNumber: 27
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 517,
      columnNumber: 13
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "source-selector", children: [
    /* @__PURE__ */ jsxDEV(
      SourceListSection,
      {
        contextid,
        sources: globaldocuments,
        sectiontitle: "Globale Dokumente",
        emptytext: "Keine globalen Dokumente verf\xFCgbar.",
        selected,
        saving,
        onToggle: handleToggle
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 578,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      SourceListSection,
      {
        contextid,
        sources: courseactivities,
        sectiontitle: "Kursaktivit\xE4ten",
        emptytext: "Keine Kursaktivit\xE4ten verf\xFCgbar.",
        selected,
        saving,
        onToggle: handleToggle
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 587,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      SourceListSection,
      {
        contextid,
        sources: externalsources,
        sectiontitle: "Externe Quellen",
        emptytext: "Keine externen Quellen hinzugef\xFCgt.",
        selected,
        saving,
        onToggle: handleToggle,
        onRemove: handleRemoveExternalSource
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 596,
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
        disabled: saving || loadingimportview,
        children: [
          /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-plus mr-1", "aria-hidden": "true" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 614,
            columnNumber: 21
          }, this),
          "Quelle hinzuf\xFCgen"
        ]
      },
      void 0,
      true,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 608,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 607,
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
          lineNumber: 620,
          columnNumber: 17
        },
        this
      ),
      saving && /* @__PURE__ */ jsxDEV("span", { className: "text-muted small", children: "Speichere..." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 629,
        columnNumber: 21
      }, this),
      saveSuccess && /* @__PURE__ */ jsxDEV("span", { className: "text-success small", children: "Gespeichert" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 633,
        columnNumber: 21
      }, this),
      error && /* @__PURE__ */ jsxDEV("span", { className: "text-danger small", children: error }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 637,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 619,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 577,
    columnNumber: 9
  }, this);
}
__name(SourceSelector, "SourceSelector");
export {
  SourceSelector as default
};
//# sourceMappingURL=source_selector.dev.js.map

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
/**
 * React component for selecting sources for a given context.
 *
 * Every source is selected with a checkbox; for a selected source a switch decides whether the AI reads its complete
 * content ("full") or looks up the passages relevant for a question ("search").
 *
 * @module     local_ai_content/source_selector
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {
  Fragment as Fragment2,
  use,
  useEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  Badge,
  Button,
  Checkbox
} from "@moodlehq/design-system";
import { closeModal, openModal } from "./modal";
import {
  loadSourceSelection,
  saveSelectedSourceIds
} from "./source_selector/data_manager";
import {
  isFiltering,
  matchesFilter,
  NoFilterMatch,
  SectionToggle,
  SourceFilter,
  SourceLabel
} from "./source_ui";
import { COMPONENT, pluginString, StringsProvider } from "./strings";
import Fetch from "@moodle/lms/core/fetch";
import MoodleString from "@moodle/lms/core/String";
import { getString } from "@moodle/lms/core/stringUtils";
const PAGE_CHARS = 3e3;
const MODES = ["full", "search"];
const MODE_ICONS = {
  full: "fa-file-lines",
  search: "fa-magnifying-glass"
};
function StringButton({ identifier, component = COMPONENT, ...props }) {
  return /* @__PURE__ */ jsxDEV(Button, { ...props, label: use(getString(identifier, component)) }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 129,
    columnNumber: 12
  }, this);
}
__name(StringButton, "StringButton");
const chooseMode = /* @__PURE__ */ __name((source, preferred) => source.modes.includes(preferred) ? preferred : source.modes[0], "chooseMode");
const getSizeString = /* @__PURE__ */ __name((length) => {
  if (length === null) {
    return ["selector_size_unknown", void 0];
  }
  if (length < PAGE_CHARS) {
    return ["selector_size_lessthanpage", void 0];
  }
  const pages = Math.round(length / PAGE_CHARS);
  return pages <= 1 ? ["selector_size_page", void 0] : ["selector_size_pages", pages];
}, "getSizeString");
function OutdatedBadge() {
  return /* @__PURE__ */ jsxDEV(
    Badge,
    {
      variant: "warning",
      label: use(pluginString("sourceoutdated")),
      title: use(pluginString("sourceoutdated_desc")),
      startIcon: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-exclamation-triangle", "aria-hidden": "true" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 172,
        columnNumber: 24
      }, this)
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 168,
      columnNumber: 9
    },
    this
  );
}
__name(OutdatedBadge, "OutdatedBadge");
function ModeSwitch({ source, mode, idPrefix, disabled, onChange }) {
  const unavailable = MODES.find((option) => !source.modes.includes(option));
  if (disabled || unavailable !== void 0) {
    const help = unavailable === void 0 ? `selector_mode_${mode}_help` : `selector_mode_${unavailable}_unavailable`;
    return /* @__PURE__ */ jsxDEV(
      Badge,
      {
        variant: "secondary",
        subtle: true,
        className: "flex-shrink-0",
        label: use(pluginString(`selector_mode_${mode}`)),
        title: use(pluginString(help)),
        startIcon: /* @__PURE__ */ jsxDEV("i", { className: `icon fa ${MODE_ICONS[mode]}`, "aria-hidden": "true" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 203,
          columnNumber: 28
        }, this)
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 197,
        columnNumber: 13
      },
      this
    );
  }
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "btn-group btn-group-sm flex-shrink-0",
      role: "radiogroup",
      "aria-label": use(pluginString("selector_mode", source.name)),
      children: MODES.map((option) => {
        const id = `${idPrefix}-mode-${option}`;
        return /* @__PURE__ */ jsxDEV(Fragment2, { children: [
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "radio",
              className: "btn-check",
              id,
              name: `${idPrefix}-mode`,
              checked: mode === option,
              onChange: () => {
                onChange(option);
              }
            },
            void 0,
            false,
            {
              fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
              lineNumber: 218,
              columnNumber: 25
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "label",
            {
              className: "btn btn-outline-primary text-nowrap",
              htmlFor: id,
              title: use(pluginString(`selector_mode_${option}_help`)),
              children: [
                /* @__PURE__ */ jsxDEV("i", { className: `icon fa ${MODE_ICONS[option]} me-1`, "aria-hidden": "true" }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
                  lineNumber: 233,
                  columnNumber: 29
                }, this),
                /* @__PURE__ */ jsxDEV(MoodleString, { identifier: `selector_mode_${option}`, component: COMPONENT }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
                  lineNumber: 234,
                  columnNumber: 29
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
              lineNumber: 228,
              columnNumber: 25
            },
            this
          )
        ] }, option, true, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 217,
          columnNumber: 21
        }, this);
      })
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 209,
      columnNumber: 9
    },
    this
  );
}
__name(ModeSwitch, "ModeSwitch");
function SourceRow({ source, context }) {
  const { idPrefix, selection, readOnly, warnChars, onToggle, onModeChange, onRemove } = context;
  const id = `${idPrefix}-${source.id}`;
  const mode = selection.get(source.id);
  const [sizeIdentifier, sizeParameter] = getSizeString(source.contentLength);
  const sizeTitle = source.contentLength === null ? use(pluginString("selector_size_unknown_help")) : void 0;
  const tooLong = mode === "full" && warnChars > 0 && source.contentLength !== null && source.contentLength > warnChars;
  return /* @__PURE__ */ jsxDEV("li", { className: "d-flex flex-wrap align-items-center gap-2 py-2", children: [
    /* @__PURE__ */ jsxDEV(
      Checkbox,
      {
        id,
        checked: mode !== void 0,
        onChange: () => {
          onToggle(source);
        },
        disabled: readOnly,
        hideLabel: true,
        label: source.name
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 259,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      SourceLabel,
      {
        htmlFor: id,
        iconUrl: source.iconUrl,
        name: source.name,
        details: /* @__PURE__ */ jsxDEV(Fragment, { children: [
          source.typeName,
          source.sourceType !== "external" && /* @__PURE__ */ jsxDEV("span", { title: sizeTitle, children: [
            " \xB7 ",
            /* @__PURE__ */ jsxDEV(MoodleString, { identifier: sizeIdentifier, component: COMPONENT, params: sizeParameter }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
              lineNumber: 279,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 277,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 274,
          columnNumber: 21
        }, this)
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 269,
        columnNumber: 13
      },
      this
    ),
    source.outdated && /* @__PURE__ */ jsxDEV(OutdatedBadge, {}, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 285,
      columnNumber: 33
    }, this),
    mode !== void 0 && onModeChange && /* @__PURE__ */ jsxDEV(
      ModeSwitch,
      {
        source,
        mode,
        idPrefix: id,
        disabled: readOnly,
        onChange: (newMode) => {
          onModeChange(source, newMode);
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 287,
        columnNumber: 17
      },
      this
    ),
    onRemove && !readOnly && /* @__PURE__ */ jsxDEV(
      Button,
      {
        variant: "ghost",
        size: "sm",
        title: use(pluginString("selector_removesource", source.name)),
        "aria-label": use(pluginString("selector_removesource", source.name)),
        startIcon: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-unlink m-0", "aria-hidden": "true" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 303,
          columnNumber: 32
        }, this),
        onClick: () => {
          onRemove(source);
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 298,
        columnNumber: 17
      },
      this
    ),
    tooLong && /* @__PURE__ */ jsxDEV("div", { className: "w-100 small text-warning-emphasis ps-4", role: "status", children: [
      /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-exclamation-triangle me-1", "aria-hidden": "true" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 311,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_fullwarning", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 312,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 310,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 258,
    columnNumber: 9
  }, this);
}
__name(SourceRow, "SourceRow");
function BulkCheckbox({ id, name, sources, context }) {
  const count = sources.filter((source) => context.selection.has(source.id)).length;
  return /* @__PURE__ */ jsxDEV(
    Checkbox,
    {
      id,
      checked: count > 0 && count === sources.length,
      indeterminate: count > 0 && count < sources.length,
      onChange: () => {
        context.onToggleAll(sources);
      },
      disabled: context.readOnly,
      hideLabel: true,
      label: use(pluginString("selector_selectgroup", name))
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 328,
      columnNumber: 9
    },
    this
  );
}
__name(BulkCheckbox, "BulkCheckbox");
function CourseSectionGroup({ section, sources, initiallyExpanded, filter, context }) {
  const initiallyOpen = initiallyExpanded || sources.some((source) => context.selection.has(source.id));
  const [expanded, setExpanded] = useState(initiallyOpen);
  const listId = `${context.idPrefix}-section-${section.id}`;
  const expandedBeforeFilterReference = useRef(null);
  useEffect(() => {
    if (isFiltering(filter)) {
      setExpanded((current) => {
        expandedBeforeFilterReference.current ??= current;
        return true;
      });
    } else if (expandedBeforeFilterReference.current !== null) {
      setExpanded(expandedBeforeFilterReference.current);
      expandedBeforeFilterReference.current = null;
    }
  }, [filter]);
  return /* @__PURE__ */ jsxDEV("div", { className: "border-top", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "d-flex align-items-center gap-2 py-2", children: [
      /* @__PURE__ */ jsxDEV(BulkCheckbox, { id: `${listId}-all`, name: section.name, sources, context }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 377,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(
        SectionToggle,
        {
          name: section.name,
          expanded,
          controls: listId,
          onToggle: () => {
            setExpanded(!expanded);
          }
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 378,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 376,
      columnNumber: 13
    }, this),
    expanded && /* @__PURE__ */ jsxDEV("ul", { id: listId, className: "list-unstyled mb-0 ps-4", children: sources.map((source) => /* @__PURE__ */ jsxDEV(SourceRow, { source, context }, source.id, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 389,
      columnNumber: 44
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 388,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 375,
    columnNumber: 9
  }, this);
}
__name(CourseSectionGroup, "CourseSectionGroup");
const filterSources = /* @__PURE__ */ __name((filter, sources, sections = []) => {
  const grouped = sections.some((section) => sources.some((source) => source.sectionId === section.id));
  if (!grouped) {
    return { visible: sources.filter((source) => matchesFilter(filter, source.name, source.typeName)), sectionsWithSources: [] };
  }
  const sectionsWithSources = sections.map((section) => ({
    section,
    sources: sources.filter((source) => source.sectionId === section.id && matchesFilter(filter, source.name, source.typeName, section.name))
  })).filter((entry) => entry.sources.length > 0);
  return { visible: sectionsWithSources.flatMap((entry) => entry.sources), sectionsWithSources };
}, "filterSources");
function SourceGroup({ titleIdentifier, emptyIdentifier, sources, sections = [], filter, context, actions }) {
  const title = use(pluginString(titleIdentifier));
  const groupId = `${context.idPrefix}-group`;
  const { visible, sectionsWithSources } = filterSources(filter, sources, sections);
  if (isFiltering(filter) && visible.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "d-flex align-items-center gap-2 pb-1 border-bottom", children: [
      visible.length > 0 && /* @__PURE__ */ jsxDEV(BulkCheckbox, { id: `${groupId}-all`, name: title, sources: visible, context }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 449,
        columnNumber: 40
      }, this),
      /* @__PURE__ */ jsxDEV("h6", { className: "mb-0 flex-grow-1", children: title }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 450,
        columnNumber: 17
      }, this),
      actions
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 448,
      columnNumber: 13
    }, this),
    sources.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mt-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: emptyIdentifier, component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 454,
      columnNumber: 56
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 454,
      columnNumber: 17
    }, this),
    sectionsWithSources.length > 0 && sectionsWithSources.map((entry) => /* @__PURE__ */ jsxDEV(
      CourseSectionGroup,
      {
        section: entry.section,
        sources: entry.sources,
        initiallyExpanded: sectionsWithSources.length === 1,
        filter,
        context
      },
      entry.section.id,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 457,
        columnNumber: 17
      },
      this
    )),
    visible.length > 0 && sectionsWithSources.length === 0 && /* @__PURE__ */ jsxDEV("ul", { className: "list-unstyled mb-0", children: visible.map((source) => /* @__PURE__ */ jsxDEV(SourceRow, { source, context }, source.id, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 468,
      columnNumber: 44
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 467,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 447,
    columnNumber: 9
  }, this);
}
__name(SourceGroup, "SourceGroup");
function TotalWarning({ length }) {
  const [sizeIdentifier, sizeParameter] = getSizeString(length);
  const size = use(pluginString(sizeIdentifier, sizeParameter));
  return /* @__PURE__ */ jsxDEV("div", { className: "alert alert-warning small py-2", role: "status", children: [
    /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-exclamation-triangle me-1", "aria-hidden": "true" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 486,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_totalwarning", component: COMPONENT, params: size }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 487,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 485,
    columnNumber: 9
  }, this);
}
__name(TotalWarning, "TotalWarning");
function ModeHelp() {
  return /* @__PURE__ */ jsxDEV("details", { className: "mb-3 border rounded p-2", children: [
    /* @__PURE__ */ jsxDEV("summary", { className: "fw-semibold", children: [
      /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-circle-question me-1", "aria-hidden": "true" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 501,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_help_heading", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 502,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 500,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("dl", { className: "mb-0 mt-2", children: MODES.map((mode) => /* @__PURE__ */ jsxDEV(Fragment2, { children: [
      /* @__PURE__ */ jsxDEV("dt", { children: [
        /* @__PURE__ */ jsxDEV("i", { className: `icon fa ${MODE_ICONS[mode]} me-1`, "aria-hidden": "true" }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 508,
          columnNumber: 29
        }, this),
        /* @__PURE__ */ jsxDEV(MoodleString, { identifier: `selector_mode_${mode}`, component: COMPONENT }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 509,
          columnNumber: 29
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 507,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsxDEV("dd", { className: "mb-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: `selector_mode_${mode}_help`, component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 512,
        columnNumber: 29
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 511,
        columnNumber: 25
      }, this)
    ] }, mode, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 506,
      columnNumber: 21
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 504,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "small text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_help_tip", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 518,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 517,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 499,
    columnNumber: 9
  }, this);
}
__name(ModeHelp, "ModeHelp");
function SourceSelector(props) {
  return /* @__PURE__ */ jsxDEV(StringsProvider, { children: /* @__PURE__ */ jsxDEV(SourceSelectorContent, { ...props }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 536,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 535,
    columnNumber: 9
  }, this);
}
__name(SourceSelector, "SourceSelector");
function SourceSelectorContent({ contextId, defaultMode = "search" }) {
  const [globalDocuments, setGlobalDocuments] = useState([]);
  const [courseActivities, setCourseActivities] = useState([]);
  const [courseSections, setCourseSections] = useState([]);
  const [courseDocuments, setCourseDocuments] = useState([]);
  const [externalSources, setExternalSources] = useState([]);
  const [selection, setSelection] = useState(/* @__PURE__ */ new Map());
  const [canSelect, setCanSelect] = useState(false);
  const [warnChars, setWarnChars] = useState(0);
  const [totalWarnChars, setTotalWarnChars] = useState(0);
  const [mode, setMode] = useState("main");
  const [importableCourses, setImportableCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(0);
  const [importCourseActivities, setImportCourseActivities] = useState([]);
  const [importCourseDocuments, setImportCourseDocuments] = useState([]);
  const [stagedImportSelection, setStagedImportSelection] = useState(/* @__PURE__ */ new Map());
  const [filter, setFilter] = useState("");
  const [importFilter, setImportFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingImportView, setLoadingImportView] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBodyRoot, setModalBodyRoot] = useState(null);
  const modalReference = useRef(null);
  const pendingSaves = useRef(0);
  const listedSources = [...globalDocuments, ...courseActivities, ...courseDocuments, ...externalSources];
  const hasOutdatedSelection = listedSources.some((source) => source.outdated && selection.has(source.id));
  const hasOutdatedSources = listedSources.some((source) => source.outdated);
  const fullLength = listedSources.filter((source) => selection.get(source.id) === "full").reduce((sum, source) => sum + (source.contentLength ?? 0), 0);
  const launcherTitle = hasOutdatedSelection ? `${use(pluginString("selector_launcher"))} \u2013 ${use(pluginString("selectedsourcesoutdated"))}` : use(pluginString("selector_launcher"));
  const showError = /* @__PURE__ */ __name((identifier) => {
    pluginString(identifier).then(setError).catch(() => void 0);
  }, "showError");
  const loadSelection = /* @__PURE__ */ __name((reload) => {
    setLoading(true);
    setError(null);
    loadSourceSelection(contextId, reload).then((loaded) => {
      setGlobalDocuments(loaded.globalDocuments);
      setCourseActivities(loaded.courseActivities);
      setCourseSections(loaded.courseSections);
      setCourseDocuments(loaded.courseDocuments);
      setExternalSources(loaded.externalSources);
      setSelection(new Map(loaded.selectedSourceIds.map((id) => [
        id,
        loaded.fullSourceIds.includes(id) ? "full" : "search"
      ])));
      setCanSelect(loaded.canSelect);
      setWarnChars(loaded.fullContentWarnChars);
      setTotalWarnChars(loaded.fullContentTotalWarnChars);
      setLoading(false);
      return loaded;
    }).catch(() => {
      showError("selector_loaderror");
      setLoading(false);
    });
  }, "loadSelection");
  useEffect(() => {
    loadSelection(false);
  }, [contextId]);
  const updateSelection = /* @__PURE__ */ __name(async (next) => {
    setSelection(next);
    setSaveSuccess(false);
    setError(null);
    setSaving(true);
    pendingSaves.current++;
    try {
      const ids = [];
      const fullIds = [];
      for (const [id, selectedMode] of next) {
        ids.push(id);
        if (selectedMode === "full") {
          fullIds.push(id);
        }
      }
      await saveSelectedSourceIds(contextId, ids, fullIds);
      setSaveSuccess(true);
    } catch {
      showError("selector_saveerror");
      try {
        const stored = await loadSourceSelection(contextId, true);
        setExternalSources(stored.externalSources);
        setSelection(new Map(stored.selectedSourceIds.map((id) => [
          id,
          stored.fullSourceIds.includes(id) ? "full" : "search"
        ])));
      } catch {
      }
    } finally {
      pendingSaves.current--;
      if (pendingSaves.current === 0) {
        setSaving(false);
      }
    }
  }, "updateSelection");
  const handleToggle = /* @__PURE__ */ __name((source) => {
    const next = new Map(selection);
    if (next.has(source.id)) {
      next.delete(source.id);
    } else {
      next.set(source.id, chooseMode(source, defaultMode));
    }
    void updateSelection(next);
  }, "handleToggle");
  const handleToggleAll = /* @__PURE__ */ __name((sources) => {
    const next = new Map(selection);
    const allSelected = sources.every((source) => next.has(source.id));
    for (const source of sources) {
      if (allSelected) {
        next.delete(source.id);
      } else if (!next.has(source.id)) {
        next.set(source.id, chooseMode(source, defaultMode));
      }
    }
    void updateSelection(next);
  }, "handleToggleAll");
  const handleModeChange = /* @__PURE__ */ __name((source, newMode) => {
    const next = new Map(selection);
    next.set(source.id, newMode);
    void updateSelection(next);
  }, "handleModeChange");
  const handleRemoveExternalSource = /* @__PURE__ */ __name((source) => {
    setExternalSources((previous) => previous.filter((external) => external.id !== source.id));
    const next = new Map(selection);
    next.delete(source.id);
    void updateSelection(next);
  }, "handleRemoveExternalSource");
  const toggleStaged = /* @__PURE__ */ __name((sources, select) => {
    setStagedImportSelection((previous) => {
      const next = new Map(previous);
      for (const source of sources) {
        if (select) {
          next.set(source.id, chooseMode(source, defaultMode));
        } else {
          next.delete(source.id);
        }
      }
      return next;
    });
  }, "toggleStaged");
  const loadImportableCourses = /* @__PURE__ */ __name(async () => {
    setLoadingImportView(true);
    setError(null);
    try {
      const response = await Fetch.performGet(
        "local_ai_content",
        `contexts/${contextId}/source-selections/importable-courses`
      );
      const data = await response.json();
      const courses = data.items;
      setImportableCourses(courses);
      setSelectedCourseId(courses[0]?.id ?? 0);
    } catch {
      showError("selector_loadcourseserror");
    } finally {
      setLoadingImportView(false);
    }
  }, "loadImportableCourses");
  const openCourseSelection = /* @__PURE__ */ __name(async () => {
    setMode("courses");
    setImportCourseActivities([]);
    setImportCourseDocuments([]);
    setStagedImportSelection(/* @__PURE__ */ new Map());
    await loadImportableCourses();
  }, "openCourseSelection");
  const loadImportableSources = /* @__PURE__ */ __name(async () => {
    if (selectedCourseId <= 0) {
      return;
    }
    setLoadingImportView(true);
    setError(null);
    try {
      const response = await Fetch.performGet(
        "local_ai_content",
        `contexts/${contextId}/source-selections/importable-sources?sourceCourseId=${selectedCourseId}`
      );
      const data = await response.json();
      const item = data.items[0];
      const existingExternalIds = new Set(externalSources.map((source) => source.id));
      const activities = item.courseActivities.filter((source) => !existingExternalIds.has(source.id));
      const documents = item.courseDocuments.filter((source) => !existingExternalIds.has(source.id));
      const nextStaged = /* @__PURE__ */ new Map();
      for (const source of [...activities, ...documents]) {
        const selectedMode = selection.get(source.id);
        if (selectedMode !== void 0) {
          nextStaged.set(source.id, selectedMode);
        }
      }
      setImportCourseActivities(activities);
      setImportCourseDocuments(documents);
      setStagedImportSelection(nextStaged);
      setImportFilter("");
      setMode("sources");
    } catch {
      showError("selector_loadimportsourceserror");
    } finally {
      setLoadingImportView(false);
    }
  }, "loadImportableSources");
  const addSelectedExternalSources = /* @__PURE__ */ __name(() => {
    const importableSources = [...importCourseActivities, ...importCourseDocuments];
    const localIds = new Set([...globalDocuments, ...courseActivities, ...courseDocuments].map((source) => source.id));
    setExternalSources((previous) => {
      const existingIds = new Set(previous.map((source) => source.id));
      const added = importableSources.filter((source) => stagedImportSelection.has(source.id) && !existingIds.has(source.id) && !localIds.has(source.id));
      return [...previous, ...added].sort((a, b) => a.name.localeCompare(b.name));
    });
    setMode("main");
    const next = new Map(selection);
    for (const [id, stagedMode] of stagedImportSelection) {
      next.set(id, stagedMode);
    }
    void updateSelection(next);
  }, "addSelectedExternalSources");
  useEffect(() => () => {
    if (!modalReference.current) {
      return;
    }
    void closeModal(modalReference.current);
    modalReference.current = null;
  }, []);
  const openSelectorModal = /* @__PURE__ */ __name(async () => {
    if (modalReference.current) {
      return;
    }
    if (pendingSaves.current === 0) {
      loadSelection(true);
    }
    const modalResult = await openModal({
      title: await pluginString("selector_launcher"),
      onShown() {
        setIsModalOpen(true);
      },
      onHidden() {
        setIsModalOpen(false);
        setModalBodyRoot(null);
        modalReference.current = null;
      }
    });
    modalReference.current = modalResult.modal;
    setModalBodyRoot(modalResult.bodyRoot);
  }, "openSelectorModal");
  const rowContext = /* @__PURE__ */ __name((idPrefix, onRemove) => ({
    idPrefix: `local_ai_content-source-selector-${contextId}-${idPrefix}`,
    selection,
    readOnly: !canSelect,
    warnChars,
    onToggle: handleToggle,
    onModeChange: handleModeChange,
    onRemove,
    onToggleAll: handleToggleAll
  }), "rowContext");
  const importRowContext = /* @__PURE__ */ __name((idPrefix) => ({
    idPrefix: `local_ai_content-source-selector-${contextId}-import-${idPrefix}`,
    selection: stagedImportSelection,
    readOnly: false,
    warnChars: 0,
    onToggle(source) {
      toggleStaged([source], !stagedImportSelection.has(source.id));
    },
    onToggleAll(sources) {
      toggleStaged(sources, sources.some((source) => !stagedImportSelection.has(source.id)));
    }
  }), "importRowContext");
  const renderError = /* @__PURE__ */ __name(() => error !== null && /* @__PURE__ */ jsxDEV("div", { className: "text-danger small mt-2", role: "alert", children: error }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 875,
    columnNumber: 49
  }, this), "renderError");
  const renderCoursesContent = /* @__PURE__ */ __name(() => /* @__PURE__ */ jsxDEV("div", { className: "local_ai_content-source-selector", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [
      /* @__PURE__ */ jsxDEV("h6", { className: "mb-0", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_choosecourse", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 880,
        columnNumber: 38
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 880,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(
        StringButton,
        {
          variant: "ghost",
          identifier: "back",
          component: "core",
          onClick: () => {
            setMode("main");
          },
          disabled: loadingImportView || saving
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 881,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 879,
      columnNumber: 13
    }, this),
    loadingImportView && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "loading" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 892,
      columnNumber: 74
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 892,
      columnNumber: 35
    }, this),
    !loadingImportView && importableCourses.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_nocourses", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 894,
      columnNumber: 56
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 894,
      columnNumber: 17
    }, this),
    !loadingImportView && importableCourses.length > 0 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "mb-3", children: [
        /* @__PURE__ */ jsxDEV("label", { className: "form-label", htmlFor: `source-selector-import-course-${contextId}`, children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_course", component: COMPONENT }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 900,
          columnNumber: 29
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 899,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV(
          "select",
          {
            id: `source-selector-import-course-${contextId}`,
            className: "form-select",
            value: selectedCourseId,
            onChange: (event) => {
              setSelectedCourseId(Number(event.target.value));
            },
            disabled: saving,
            children: importableCourses.map((course) => /* @__PURE__ */ jsxDEV("option", { value: course.id, children: course.name }, course.id, false, {
              fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
              lineNumber: 912,
              columnNumber: 33
            }, this))
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 902,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 898,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV(
        StringButton,
        {
          variant: "primary",
          identifier: "selector_loadsources",
          onClick: () => {
            void loadImportableSources();
          },
          disabled: selectedCourseId <= 0 || saving || loadingImportView
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 916,
          columnNumber: 21
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 897,
      columnNumber: 17
    }, this),
    renderError()
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 878,
    columnNumber: 9
  }, this), "renderCoursesContent");
  const renderImportSourcesContent = /* @__PURE__ */ __name(() => {
    const courseName = importableCourses.find((course) => course.id === selectedCourseId)?.name ?? "";
    return /* @__PURE__ */ jsxDEV("div", { className: "local_ai_content-source-selector", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [
        /* @__PURE__ */ jsxDEV("h6", { className: "mb-0", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_importtitle", component: COMPONENT, params: courseName }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 937,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 936,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV(
          StringButton,
          {
            variant: "ghost",
            identifier: "selector_changecourse",
            onClick: () => {
              setMode("courses");
            },
            disabled: loadingImportView || saving
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 939,
            columnNumber: 21
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 935,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(SourceFilter, { id: `local_ai_content-source-selector-${contextId}-import-filter`, onChange: setImportFilter }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 949,
        columnNumber: 17
      }, this),
      isFiltering(importFilter) && [
        filterSources(importFilter, importCourseActivities),
        filterSources(importFilter, importCourseDocuments)
      ].every((result) => result.visible.length === 0) && /* @__PURE__ */ jsxDEV(NoFilterMatch, {}, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 953,
        columnNumber: 67
      }, this),
      /* @__PURE__ */ jsxDEV(
        SourceGroup,
        {
          titleIdentifier: "selector_courseactivities",
          emptyIdentifier: "selector_nocourseactivities",
          sources: importCourseActivities,
          filter: importFilter,
          context: importRowContext("activities")
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 954,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        SourceGroup,
        {
          titleIdentifier: "selector_coursedocuments",
          emptyIdentifier: "selector_nocoursedocuments",
          sources: importCourseDocuments,
          filter: importFilter,
          context: importRowContext("documents")
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
          lineNumber: 961,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "d-flex gap-2 mt-3", children: [
        /* @__PURE__ */ jsxDEV(
          StringButton,
          {
            variant: "secondary",
            identifier: "cancel",
            component: "core",
            onClick: () => {
              setMode("main");
            },
            disabled: saving
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 970,
            columnNumber: 21
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          StringButton,
          {
            variant: "primary",
            identifier: "add",
            component: "core",
            onClick: addSelectedExternalSources,
            disabled: saving || stagedImportSelection.size === 0
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 979,
            columnNumber: 21
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 969,
        columnNumber: 17
      }, this),
      renderError()
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 934,
      columnNumber: 13
    }, this);
  }, "renderImportSourcesContent");
  const renderMainContent = /* @__PURE__ */ __name(() => /* @__PURE__ */ jsxDEV("div", { className: "local_ai_content-source-selector", children: [
    /* @__PURE__ */ jsxDEV("p", { className: "mb-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_intro", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 995,
      columnNumber: 33
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 995,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(ModeHelp, {}, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 996,
      columnNumber: 13
    }, this),
    !canSelect && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-info small py-2", role: "status", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_readonly", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 999,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 998,
      columnNumber: 17
    }, this),
    hasOutdatedSources && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-warning small py-2", role: "status", children: [
      /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-exclamation-triangle me-1", "aria-hidden": "true" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1004,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "sourceoutdated_desc", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1005,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 1003,
      columnNumber: 17
    }, this),
    totalWarnChars > 0 && fullLength > totalWarnChars && /* @__PURE__ */ jsxDEV(TotalWarning, { length: fullLength }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 1008,
      columnNumber: 67
    }, this),
    /* @__PURE__ */ jsxDEV(
      SourceFilter,
      {
        id: `local_ai_content-source-selector-${contextId}-filter`,
        initialQuery: filter,
        onChange: setFilter
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1009,
        columnNumber: 13
      },
      this
    ),
    isFiltering(filter) && [
      filterSources(filter, courseActivities, courseSections),
      filterSources(filter, courseDocuments),
      filterSources(filter, globalDocuments),
      filterSources(filter, externalSources)
    ].every((result) => result.visible.length === 0) && /* @__PURE__ */ jsxDEV(NoFilterMatch, {}, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 1019,
      columnNumber: 63
    }, this),
    /* @__PURE__ */ jsxDEV(
      SourceGroup,
      {
        titleIdentifier: "selector_courseactivities",
        emptyIdentifier: "selector_nocourseactivities",
        sources: courseActivities,
        sections: courseSections,
        filter,
        context: rowContext("activities")
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1020,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      SourceGroup,
      {
        titleIdentifier: "selector_coursedocuments",
        emptyIdentifier: "selector_nocoursedocuments",
        sources: courseDocuments,
        filter,
        context: rowContext("documents")
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1028,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      SourceGroup,
      {
        titleIdentifier: "selector_globaldocuments",
        emptyIdentifier: "selector_noglobaldocuments",
        sources: globalDocuments,
        filter,
        context: rowContext("global")
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1035,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      SourceGroup,
      {
        titleIdentifier: "selector_externalsources",
        emptyIdentifier: "selector_noexternalsources",
        sources: externalSources,
        filter,
        context: rowContext("external", handleRemoveExternalSource),
        actions: canSelect && /* @__PURE__ */ jsxDEV(
          StringButton,
          {
            variant: "outline-secondary",
            identifier: "selector_addsource",
            startIcon: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-plus", "aria-hidden": "true" }, void 0, false, {
              fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
              lineNumber: 1052,
              columnNumber: 36
            }, this),
            onClick: () => {
              void openCourseSelection();
            },
            disabled: saving || loadingImportView
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 1049,
            columnNumber: 21
          },
          this
        )
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1042,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "mt-2 d-flex align-items-center gap-3 small", "aria-live": "polite", children: [
      saving && /* @__PURE__ */ jsxDEV("span", { className: "text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_saving", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1063,
        columnNumber: 50
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1063,
        columnNumber: 21
      }, this),
      !saving && saveSuccess && /* @__PURE__ */ jsxDEV("span", { className: "text-success", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_saved", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1066,
        columnNumber: 52
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1066,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 1061,
      columnNumber: 13
    }, this),
    renderError()
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 994,
    columnNumber: 9
  }, this), "renderMainContent");
  const renderSelectorContent = /* @__PURE__ */ __name(() => {
    if (loading) {
      return /* @__PURE__ */ jsxDEV("div", { className: "text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_loading", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1075,
        columnNumber: 48
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1075,
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
        className: "btn btn-icon icon-no-margin p-0 local_ai_content-source-selector-launcher",
        title: launcherTitle,
        "aria-label": launcherTitle,
        onClick: () => {
          void openSelectorModal();
        },
        children: [
          /* @__PURE__ */ jsxDEV("i", { className: "fa fa-paperclip", "aria-hidden": "true" }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
            lineNumber: 1100,
            columnNumber: 17
          }, this),
          hasOutdatedSelection && /* @__PURE__ */ jsxDEV(
            "i",
            {
              className: "fa fa-exclamation-triangle local_ai_content-source-selector-outdated",
              "aria-hidden": "true"
            },
            void 0,
            false,
            {
              fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
              lineNumber: 1102,
              columnNumber: 21
            },
            this
          )
        ]
      },
      void 0,
      true,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 1091,
        columnNumber: 13
      },
      this
    ),
    isModalOpen && modalBodyRoot && createPortal(renderSelectorContent(), modalBodyRoot)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 1090,
    columnNumber: 9
  }, this);
}
__name(SourceSelectorContent, "SourceSelectorContent");
export {
  SourceSelector as default
};
//# sourceMappingURL=source_selector.dev.js.map

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * UI parts shared by the source selector and the source management, so both list sources alike.
 *
 * @module     local_ai_content/source_ui
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {
  use,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Button } from "@moodlehq/design-system";
import { COMPONENT, pluginString } from "./strings";
import MoodleString from "@moodle/lms/core/String";
import { debounce } from "@moodle/lms/core/utils";
const FILTER_DELAY = 250;
const matchesFilter = /* @__PURE__ */ __name((query, ...texts) => {
  const haystack = texts.join(" ").toLocaleLowerCase();
  return query.toLocaleLowerCase().split(/\s+/u).filter((word) => word !== "").every((word) => haystack.includes(word));
}, "matchesFilter");
const isFiltering = /* @__PURE__ */ __name((query) => query.trim() !== "", "isFiltering");
function SourceFilter({ id, initialQuery = "", onChange }) {
  const [value, setValue] = useState(initialQuery);
  const label = use(pluginString("filter_label"));
  const onChangeReference = useRef(onChange);
  onChangeReference.current = onChange;
  const report = useMemo(() => debounce((query) => {
    onChangeReference.current(query);
  }, FILTER_DELAY, { pending: true, cancel: true }), []);
  useEffect(() => () => {
    report.cancel?.();
  }, [report]);
  return /* @__PURE__ */ jsxDEV("div", { className: "input-group mb-3", children: [
    /* @__PURE__ */ jsxDEV("span", { className: "input-group-text", children: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-filter fa-fw m-0", "aria-hidden": "true" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
      lineNumber: 88,
      columnNumber: 48
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
      lineNumber: 88,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        id,
        type: "search",
        className: "form-control",
        value,
        placeholder: use(pluginString("filter_placeholder")),
        "aria-label": label,
        onChange: (event) => {
          setValue(event.target.value);
          report(event.target.value);
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
        lineNumber: 89,
        columnNumber: 13
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
    lineNumber: 87,
    columnNumber: 9
  }, this);
}
__name(SourceFilter, "SourceFilter");
function NoFilterMatch() {
  return /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-3", role: "status", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "filter_nomatch", component: COMPONENT }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
    lineNumber: 113,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
    lineNumber: 112,
    columnNumber: 9
  }, this);
}
__name(NoFilterMatch, "NoFilterMatch");
function SelectedCount({ selected, total }) {
  return /* @__PURE__ */ jsxDEV("span", { className: "small text-muted text-nowrap", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "selector_selectedcount", component: COMPONENT, params: { selected, total } }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
    lineNumber: 127,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
    lineNumber: 126,
    columnNumber: 9
  }, this);
}
__name(SelectedCount, "SelectedCount");
function SectionToggle({ name, expanded, controls, onToggle }) {
  return /* @__PURE__ */ jsxDEV(
    Button,
    {
      variant: "ghost",
      className: "flex-grow-1 justify-content-start fw-semibold text-start px-1",
      "aria-expanded": expanded,
      "aria-controls": controls,
      title: use(pluginString("selector_toggle", name)),
      startIcon: /* @__PURE__ */ jsxDEV("i", { className: `icon fa fa-fw m-0 fa-chevron-${expanded ? "down" : "right"}`, "aria-hidden": "true" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
        lineNumber: 151,
        columnNumber: 24
      }, this),
      label: name,
      onClick: onToggle
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
      lineNumber: 145,
      columnNumber: 9
    },
    this
  );
}
__name(SectionToggle, "SectionToggle");
function SourceLabel({ htmlFor, iconUrl, name, details, url }) {
  return /* @__PURE__ */ jsxDEV("label", { htmlFor, className: "flex-grow-1 mb-0 d-flex align-items-center gap-2", children: [
    iconUrl === "" ? /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-file-lines fa-fw m-0", "aria-hidden": "true" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
      lineNumber: 174,
      columnNumber: 19
    }, this) : /* @__PURE__ */ jsxDEV("img", { src: iconUrl, className: "icon activityicon m-0", alt: "" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
      lineNumber: 175,
      columnNumber: 19
    }, this),
    /* @__PURE__ */ jsxDEV("span", { className: "d-flex flex-column", children: [
      url === void 0 || url === null ? /* @__PURE__ */ jsxDEV("span", { children: name }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
        lineNumber: 177,
        columnNumber: 54
      }, this) : /* @__PURE__ */ jsxDEV("a", { href: url, children: name }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
        lineNumber: 177,
        columnNumber: 76
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "small text-muted", children: details }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
        lineNumber: 178,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
      lineNumber: 176,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_ui.tsx",
    lineNumber: 172,
    columnNumber: 9
  }, this);
}
__name(SourceLabel, "SourceLabel");
export {
  NoFilterMatch,
  SectionToggle,
  SelectedCount,
  SourceFilter,
  SourceLabel,
  isFiltering,
  matchesFilter
};
//# sourceMappingURL=source_ui.dev.js.map

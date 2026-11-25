var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
/**
 * Source management of a course: share activities and documents with AI and make them searchable.
 *
 * @module     local_ai_content/source_manager
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
  Checkbox,
  ProgressBar,
  Switch
} from "@moodlehq/design-system";
import { closeModal, openModal } from "./modal";
import ContentPreview from "./content_preview";
import {
  createDocument,
  deleteDocument,
  getIndexStates,
  getIndexedChunks,
  getSources,
  indexSources,
  setSharing,
  updateDocument
} from "./source_manager/repository";
import {
  isFiltering,
  matchesFilter,
  NoFilterMatch,
  SectionToggle,
  SelectedCount,
  SourceFilter,
  SourceLabel
} from "./source_ui";
import { COMPONENT, pluginString, StringsProvider } from "./strings";
import { requireAsync } from "@moodle/lms/core/amd";
import Log from "@moodle/lms/core/log";
import MoodleString from "@moodle/lms/core/String";
import { getString } from "@moodle/lms/core/stringUtils";
const TABLE_CLASSES = "table table-sm table-hover table-borderless align-middle local_ai_content-source-table";
const errorMessage = /* @__PURE__ */ __name((caught) => caught instanceof Error ? caught.message : String(caught), "errorMessage");
const isActive = /* @__PURE__ */ __name((state) => state.status === "queued" || state.status === "running", "isActive");
const STATUS_BADGE_VARIANTS = {
  idle: "secondary",
  queued: "info",
  running: "info",
  indexed: "success",
  failed: "danger",
  outdated: "warning"
};
const canOfferIndexing = /* @__PURE__ */ __name((state, indexingAvailable) => indexingAvailable && (!state.hasIndex || state.canIndexCurrentModel && state.currentModel !== null), "canOfferIndexing");
const isIndexable = /* @__PURE__ */ __name((enabled, state, indexingAvailable) => enabled && !isActive(state) && canOfferIndexing(state, indexingAvailable), "isIndexable");
const isSearchable = /* @__PURE__ */ __name((state) => state.models.some((model) => model.status === "indexed" || model.status === "outdated"), "isSearchable");
const isPreviewOutdated = /* @__PURE__ */ __name((state) => {
  const searchable = state.models.filter((model) => model.status === "indexed" || model.status === "outdated");
  const shown = searchable.find((model) => model.model === state.currentModel) ?? searchable[0];
  return shown?.status === "outdated";
}, "isPreviewOutdated");
const filterOverview = /* @__PURE__ */ __name((query, sectionsWithModules, { modules, courseDocuments, globalDocuments }) => {
  const filtering = isFiltering(query);
  const visibleSections = sectionsWithModules.map(({ section, rows }) => ({
    section,
    rows: rows.filter((row) => matchesFilter(query, row.name, row.modDisplayName, section.name))
  })).filter((entry) => entry.rows.length > 0);
  const visibleModules = sectionsWithModules.length === 0 ? modules.filter((row) => matchesFilter(query, row.name, row.modDisplayName)) : visibleSections.flatMap((entry) => entry.rows);
  const visibleCourseDocuments = courseDocuments.filter((row) => matchesFilter(query, row.name, row.description));
  const visibleGlobalDocuments = globalDocuments.filter((row) => matchesFilter(query, row.name, row.description));
  return {
    visibleSections,
    visibleModules,
    visibleCourseDocuments,
    visibleGlobalDocuments,
    showModules: !filtering || visibleModules.length > 0,
    showCourseDocuments: !filtering || visibleCourseDocuments.length > 0,
    showGlobalDocuments: !filtering || visibleGlobalDocuments.length > 0,
    noMatch: filtering && visibleModules.length + visibleCourseDocuments.length + visibleGlobalDocuments.length === 0
  };
}, "filterOverview");
const setIds = /* @__PURE__ */ __name((current, ids, select) => {
  const next = new Set(current);
  for (const id of ids) {
    if (select) {
      next.add(id);
    } else {
      next.delete(id);
    }
  }
  return next;
}, "setIds");
const formatTimestamp = /* @__PURE__ */ __name((timestamp) => timestamp === null ? "-" : new Date(timestamp).toLocaleString(), "formatTimestamp");
const countSelected = /* @__PURE__ */ __name((ids, selected) => ids.filter((id) => selected.has(id)).length, "countSelected");
function SelectAllCheckbox({ id, ids, selected, disabled, label, onChange }) {
  const count = countSelected(ids, selected);
  const labelText = use(label === void 0 ? pluginString("selectall") : pluginString("selector_selectgroup", label));
  return /* @__PURE__ */ jsxDEV(
    Checkbox,
    {
      id,
      checked: count > 0 && count === ids.length,
      indeterminate: count > 0 && count < ids.length,
      disabled: disabled || ids.length === 0,
      onChange: () => {
        onChange(ids, count !== ids.length);
      },
      hideLabel: true,
      label: labelText
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 225,
      columnNumber: 9
    },
    this
  );
}
__name(SelectAllCheckbox, "SelectAllCheckbox");
function RowCheckbox({ id, name, checked, disabled, onChange }) {
  return /* @__PURE__ */ jsxDEV(
    Checkbox,
    {
      id,
      checked,
      disabled,
      onChange,
      hideLabel: true,
      label: use(pluginString("selectsource", name))
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 250,
      columnNumber: 9
    },
    this
  );
}
__name(RowCheckbox, "RowCheckbox");
function SharingStatus({ state, indexingAvailable, disabled, onIndex }) {
  const active = isActive(state);
  const indexLabel = use(state.hasIndex && state.currentModel !== null ? pluginString("indexwithmymodel", state.currentModel) : pluginString("makesearchable"));
  const otherModels = state.canIndexCurrentModel ? state.models.filter((model) => model.status === "indexed").map((model) => model.model) : [];
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    state.hasIndex && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(Badge, { variant: STATUS_BADGE_VARIANTS[state.status], label: state.statusLabel }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 285,
        columnNumber: 21
      }, this),
      active && /* @__PURE__ */ jsxDEV("div", { className: "mt-1", children: /* @__PURE__ */ jsxDEV(
        ProgressBar,
        {
          value: Math.max(2, state.percent),
          min: 0,
          max: 100,
          status: "loading",
          labelVariant: "none",
          title: state.message === "" ? state.statusLabel : state.message,
          count: `${Math.round(state.percent)}%`,
          animated: true
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 288,
          columnNumber: 29
        },
        this
      ) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 287,
        columnNumber: 25
      }, this),
      state.status === "failed" && state.message !== "" && /* @__PURE__ */ jsxDEV("div", { className: "small text-danger mt-1", children: state.message }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 301,
        columnNumber: 25
      }, this),
      otherModels.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mt-1", children: /* @__PURE__ */ jsxDEV(
        MoodleString,
        {
          identifier: "searchableforothermodels",
          component: COMPONENT,
          params: otherModels.join(", ")
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 305,
          columnNumber: 29
        },
        this
      ) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 304,
        columnNumber: 25
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 284,
      columnNumber: 17
    }, this),
    !state.hasIndex && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(Badge, { variant: "secondary", label: use(pluginString("sharednotsearchable")) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 316,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mt-1", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "sharednotsearchable_desc", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 318,
        columnNumber: 25
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 317,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 315,
      columnNumber: 17
    }, this),
    canOfferIndexing(state, indexingAvailable) && /* @__PURE__ */ jsxDEV(
      Button,
      {
        variant: "ghost",
        size: "sm",
        className: "mt-1",
        label: indexLabel,
        disabled: disabled || active,
        onClick: onIndex
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 323,
        columnNumber: 17
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 282,
    columnNumber: 9
  }, this);
}
__name(SharingStatus, "SharingStatus");
function SharingCells({ id, name, enabled, state, indexingAvailable, disabled, onToggle, onIndex }) {
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(
      Switch,
      {
        id,
        checked: enabled,
        disabled,
        onChange: onToggle,
        hideLabel: true,
        label: use(pluginString("manager_sharesource", name))
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 352,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 351,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("td", { children: enabled && /* @__PURE__ */ jsxDEV(SharingStatus, { state, indexingAvailable, disabled, onIndex }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 363,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 361,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("td", { className: "text-nowrap", children: enabled && state.hasIndex && formatTimestamp(state.lastIndexedAt) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 366,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 350,
    columnNumber: 9
  }, this);
}
__name(SharingCells, "SharingCells");
function TableHeader({ checkbox, firstColumnIdentifier, withActions }) {
  return /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { className: "border-bottom", children: [
    /* @__PURE__ */ jsxDEV("th", { children: checkbox }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 382,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("th", { children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: firstColumnIdentifier, component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 383,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 383,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("th", { children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "manager_column_shared", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 384,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 384,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("th", { children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "status" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 385,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 385,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("th", { children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "manager_column_lastindexed", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 386,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 386,
      columnNumber: 17
    }, this),
    withActions ? /* @__PURE__ */ jsxDEV("th", { children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "actions" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 388,
      columnNumber: 36
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 388,
      columnNumber: 32
    }, this) : /* @__PURE__ */ jsxDEV("td", {}, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 388,
      columnNumber: 81
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 381,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 380,
    columnNumber: 9
  }, this);
}
__name(TableHeader, "TableHeader");
function GroupHeader({ titleIdentifier, children }) {
  return /* @__PURE__ */ jsxDEV("div", { className: "d-flex align-items-center gap-2 pb-1 mb-2 border-bottom", children: [
    /* @__PURE__ */ jsxDEV("h5", { className: "mb-0 flex-grow-1", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: titleIdentifier, component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 403,
      columnNumber: 46
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 403,
      columnNumber: 13
    }, this),
    children
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 402,
    columnNumber: 9
  }, this);
}
__name(GroupHeader, "GroupHeader");
function BulkActions({
  count,
  total,
  shareCount,
  stopSharingCount,
  indexCount,
  showIndex,
  disabled,
  onShare,
  onStopSharing,
  onIndex
}) {
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "sticky-bottom bg-body d-flex flex-wrap align-items-center gap-2 mt-3 p-2 border rounded shadow-sm",
      role: "region",
      "aria-label": use(pluginString("bulk_selectedcount", count)),
      children: [
        /* @__PURE__ */ jsxDEV(
          Button,
          {
            variant: "outline-secondary",
            label: use(pluginString("bulk_share")),
            disabled: disabled || shareCount === 0,
            onClick: onShare
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 435,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          Button,
          {
            variant: "outline-secondary",
            label: use(pluginString("bulk_stopsharing")),
            disabled: disabled || stopSharingCount === 0,
            onClick: onStopSharing
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 441,
            columnNumber: 13
          },
          this
        ),
        showIndex && /* @__PURE__ */ jsxDEV(
          Button,
          {
            variant: "outline-secondary",
            label: use(pluginString("bulk_index")),
            disabled: disabled || indexCount === 0,
            onClick: onIndex
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 448,
            columnNumber: 17
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("span", { className: "ms-auto", children: /* @__PURE__ */ jsxDEV(SelectedCount, { selected: count, total }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 456,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 455,
          columnNumber: 13
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 430,
      columnNumber: 9
    },
    this
  );
}
__name(BulkActions, "BulkActions");
function DocumentForm({ draft, showValidation, error, onChange }) {
  const nameInvalid = showValidation && draft.name.trim() === "";
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsxDEV("label", { className: "form-label", htmlFor: "local_ai_content-document-name", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "name" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 476,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 475,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          id: "local_ai_content-document-name",
          className: `form-control${nameInvalid ? " is-invalid" : ""}`,
          value: draft.name,
          required: true,
          onChange: (event) => {
            onChange({ ...draft, name: event.target.value });
          }
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 478,
          columnNumber: 17
        },
        this
      ),
      nameInvalid && /* @__PURE__ */ jsxDEV("div", { className: "invalid-feedback", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "required" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 487,
        columnNumber: 67
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 487,
        columnNumber: 33
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 474,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsxDEV("label", { className: "form-label", htmlFor: "local_ai_content-document-description", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "description" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 491,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 490,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          id: "local_ai_content-document-description",
          className: "form-control",
          value: draft.description,
          onChange: (event) => {
            onChange({ ...draft, description: event.target.value });
          }
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 493,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 489,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsxDEV("label", { className: "form-label", htmlFor: "local_ai_content-document-content", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "content" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 504,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 503,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(
        "textarea",
        {
          id: "local_ai_content-document-content",
          className: "form-control",
          rows: 10,
          value: draft.content,
          onChange: (event) => {
            onChange({ ...draft, content: event.target.value });
          }
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 506,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 502,
      columnNumber: 13
    }, this),
    error !== null && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-danger mb-0", role: "alert", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 516,
      columnNumber: 32
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 473,
    columnNumber: 9
  }, this);
}
__name(DocumentForm, "DocumentForm");
function CreateDocumentButton({ disabled, onClick }) {
  return /* @__PURE__ */ jsxDEV(
    Button,
    {
      variant: "outline-secondary",
      disabled,
      onClick,
      startIcon: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-plus", "aria-hidden": "true" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 530,
        columnNumber: 24
      }, this),
      label: use(pluginString("manager_createdocument"))
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 526,
      columnNumber: 9
    },
    this
  );
}
__name(CreateDocumentButton, "CreateDocumentButton");
function DocumentActionButton({ labelIdentifier, icon, variant, name, disabled, onClick }) {
  const label = use(pluginString(labelIdentifier, name));
  return /* @__PURE__ */ jsxDEV(
    Button,
    {
      variant,
      disabled,
      onClick,
      "aria-label": label,
      title: label,
      startIcon: /* @__PURE__ */ jsxDEV("i", { className: `icon fa ${icon} m-0`, "aria-hidden": "true" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 555,
        columnNumber: 24
      }, this)
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 549,
      columnNumber: 9
    },
    this
  );
}
__name(DocumentActionButton, "DocumentActionButton");
function PreviewButton({ name, state, onClick }) {
  const label = use(pluginString("preview_show", name));
  const notSearchableLabel = use(pluginString("preview_notsearchable"));
  const searchable = isSearchable(state);
  return /* @__PURE__ */ jsxDEV(
    Button,
    {
      variant: "outline-secondary",
      disabled: !searchable,
      onClick,
      "aria-label": label,
      title: searchable ? label : notSearchableLabel,
      startIcon: /* @__PURE__ */ jsxDEV("i", { className: "icon fa fa-magnifying-glass m-0", "aria-hidden": "true" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 574,
        columnNumber: 24
      }, this)
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 568,
      columnNumber: 9
    },
    this
  );
}
__name(PreviewButton, "PreviewButton");
function IndexedContentPreview({ preview, onPage }) {
  const { page, pageCount, content, error } = preview;
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    preview.outdated && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-warning", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "preview_outdated", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 587,
      columnNumber: 54
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 587,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV(ContentPreview, { content, error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 589,
      columnNumber: 13
    }, this),
    pageCount > 1 && /* @__PURE__ */ jsxDEV("div", { className: "d-flex align-items-center justify-content-between mt-2", children: [
      /* @__PURE__ */ jsxDEV(
        Button,
        {
          variant: "outline-secondary",
          label: use(getString("previous", "core")),
          disabled: page <= 1 || content === null,
          onClick: () => {
            onPage(page - 1);
          }
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 592,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("span", { className: "small text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "preview_page", component: COMPONENT, params: { page, pages: pageCount } }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 601,
        columnNumber: 25
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 600,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV(
        Button,
        {
          variant: "outline-secondary",
          label: use(getString("next", "core")),
          disabled: page >= pageCount || content === null,
          onClick: () => {
            onPage(page + 1);
          }
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 603,
          columnNumber: 21
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 591,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 585,
    columnNumber: 9
  }, this);
}
__name(IndexedContentPreview, "IndexedContentPreview");
function SourceManager(props) {
  return /* @__PURE__ */ jsxDEV(StringsProvider, { children: /* @__PURE__ */ jsxDEV(SourceManagerContent, { ...props }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 626,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 625,
    columnNumber: 9
  }, this);
}
__name(SourceManager, "SourceManager");
function SourceManagerContent({ contextid }) {
  const [payload, setPayload] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pollIntervalMs, setPollIntervalMs] = useState(5e3);
  const [selectedCmIds, setSelectedCmIds] = useState(/* @__PURE__ */ new Set());
  const [selectedDocumentIds, setSelectedDocumentIds] = useState(/* @__PURE__ */ new Set());
  const [expandedSections, setExpandedSections] = useState(null);
  const [filter, setFilter] = useState("");
  const expandedBeforeFilterReference = useRef(null);
  const [draft, setDraft] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [modalBodyRoot, setModalBodyRoot] = useState(null);
  const modalReference = useRef(null);
  const saveDocumentReference = useRef(() => void 0);
  const loggedDebugInfoReference = useRef({});
  const [preview, setPreview] = useState(null);
  const [previewBodyRoot, setPreviewBodyRoot] = useState(null);
  const previewModalReference = useRef(null);
  const previewCounterReference = useRef(0);
  const hasActiveTasks = payload !== null && [
    ...payload.items.modules,
    ...payload.items.globalDocuments,
    ...payload.items.courseDocuments
  ].some((row) => isActive(row.indexState));
  const logDebugInfo = /* @__PURE__ */ __name((states) => {
    for (const state of states) {
      if (state.debugInfo === "" || loggedDebugInfoReference.current[state.sourceId] === state.debugInfo) {
        continue;
      }
      loggedDebugInfoReference.current[state.sourceId] = state.debugInfo;
      Log.debug(`Indexing failed for source ${state.sourceId}:
${state.debugInfo}`, COMPONENT);
    }
  }, "logDebugInfo");
  const applyPayload = /* @__PURE__ */ __name((data) => {
    logDebugInfo([
      ...data.items.modules,
      ...data.items.globalDocuments,
      ...data.items.courseDocuments
    ].map((row) => row.indexState));
    setPayload(data);
  }, "applyPayload");
  const applyIndexStates = /* @__PURE__ */ __name((states) => {
    logDebugInfo(states);
    const byId = new Map(states.map((state) => [state.sourceId, state]));
    const merge = /* @__PURE__ */ __name((row, sourceId) => {
      const state = byId.get(sourceId);
      return state ? { ...row, indexState: state } : row;
    }, "merge");
    setPayload((current) => current && {
      ...current,
      items: {
        modules: current.items.modules.map((row) => merge(row, row.sourceId)),
        globalDocuments: current.items.globalDocuments.map((row) => merge(row, row.id)),
        courseDocuments: current.items.courseDocuments.map((row) => merge(row, row.id))
      }
    });
  }, "applyIndexStates");
  const runAction = /* @__PURE__ */ __name(async (action, errorIdentifier = "manager_actionerror") => {
    setSaving(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (error_) {
      setError(await pluginString(errorIdentifier, errorMessage(error_)));
      return false;
    } finally {
      setSaving(false);
    }
  }, "runAction");
  const share = /* @__PURE__ */ __name(async (cmIds, documentIds, enabled) => runAction(async () => {
    applyPayload(await setSharing(contextid, cmIds, documentIds, enabled));
  }), "share");
  const index = /* @__PURE__ */ __name(async (sourceIds) => runAction(async () => {
    applyIndexStates(await indexSources(sourceIds));
  }, "manager_indexerror"), "index");
  const openDocumentModal = /* @__PURE__ */ __name(async (document) => {
    setDraft(document);
    setShowValidation(false);
    setError(null);
    const { modal, bodyRoot } = await openModal({
      title: await pluginString(document.id === null ? "manager_createdocument" : "manager_editdocument"),
      saveLabel: await getString("savechanges", "core"),
      onSave() {
        saveDocumentReference.current();
      },
      onHidden() {
        setDraft(null);
        setModalBodyRoot(null);
        modalReference.current = null;
      }
    });
    modalReference.current = modal;
    setModalBodyRoot(bodyRoot);
  }, "openDocumentModal");
  const saveDocument = /* @__PURE__ */ __name(async () => {
    if (draft === null || modalReference.current === null) {
      return;
    }
    if (draft.name.trim() === "") {
      setShowValidation(true);
      return;
    }
    const { id, scope, ...fields } = draft;
    const saved = await runAction(async () => {
      if (id === null) {
        await createDocument(contextid, scope, fields);
        applyPayload(await getSources(contextid));
      } else {
        applyPayload(await updateDocument(contextid, id, fields));
      }
    });
    if (saved) {
      await closeModal(modalReference.current);
    }
  }, "saveDocument");
  const confirmDeleteDocument = /* @__PURE__ */ __name(async (document) => {
    const notification = await requireAsync("core/notification");
    try {
      await notification.deleteCancelPromise(
        await pluginString("manager_deletedocument"),
        await pluginString("manager_deletedocument_confirm", document.name),
        await getString("delete", "core")
      );
    } catch {
      return;
    }
    await runAction(async () => {
      applyPayload(await deleteDocument(contextid, document.id));
    });
  }, "confirmDeleteDocument");
  const loadPreviewPage = /* @__PURE__ */ __name(async (sourceId, page) => {
    previewCounterReference.current++;
    const requestId = previewCounterReference.current;
    setPreview((current) => current && {
      ...current,
      page,
      content: null,
      error: null
    });
    let update;
    try {
      const { items, pagination } = await getIndexedChunks(contextid, sourceId, page);
      update = {
        content: items.map((item) => item.content).join(""),
        pageCount: Math.max(1, Math.ceil(pagination.totalItems / pagination.pageSize))
      };
    } catch (error_) {
      update = { error: await pluginString("preview_loaderror", errorMessage(error_)) };
    }
    if (requestId === previewCounterReference.current) {
      setPreview((current) => current && { ...current, ...update });
    }
  }, "loadPreviewPage");
  const openPreviewModal = /* @__PURE__ */ __name(async (name, sourceId, state) => {
    setPreview({
      sourceId,
      page: 1,
      pageCount: 1,
      outdated: isPreviewOutdated(state),
      content: null,
      error: null
    });
    void loadPreviewPage(sourceId, 1);
    const { modal, bodyRoot } = await openModal({
      title: await pluginString("preview_title", name),
      onHidden() {
        previewCounterReference.current++;
        setPreview(null);
        setPreviewBodyRoot(null);
        previewModalReference.current = null;
      }
    });
    previewModalReference.current = modal;
    setPreviewBodyRoot(bodyRoot);
  }, "openPreviewModal");
  useEffect(() => {
    saveDocumentReference.current = () => {
      void saveDocument();
    };
  });
  useEffect(() => {
    getSources(contextid).then(applyPayload).catch(async (error_) => {
      setError(await pluginString("manager_loaderror", errorMessage(error_)));
    });
  }, [contextid]);
  useEffect(() => {
    if (!hasActiveTasks) {
      return void 0;
    }
    const timer = setInterval(() => {
      getIndexStates(contextid).then((data) => {
        setPollIntervalMs(data.pollIntervalSeconds * 1e3);
        applyIndexStates(data.items);
      }).catch(() => void 0);
    }, pollIntervalMs);
    return () => {
      clearInterval(timer);
    };
  }, [hasActiveTasks, contextid, pollIntervalMs]);
  useEffect(() => () => {
    if (modalReference.current) {
      void closeModal(modalReference.current);
    }
    if (previewModalReference.current) {
      void closeModal(previewModalReference.current);
    }
  }, []);
  if (!payload) {
    return error === null ? /* @__PURE__ */ jsxDEV("div", { className: "text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "loading" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 909,
      columnNumber: 43
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 909,
      columnNumber: 15
    }, this) : /* @__PURE__ */ jsxDEV("div", { className: "alert alert-danger", role: "alert", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 910,
      columnNumber: 15
    }, this);
  }
  const { modules, courseDocuments, globalDocuments } = payload.items;
  const editableDocuments = [...courseDocuments, ...globalDocuments].filter((row) => row.canEdit);
  const selectedModules = modules.filter((row) => selectedCmIds.has(row.cmId));
  const selectedDocuments = editableDocuments.filter((row) => selectedDocumentIds.has(row.id));
  const selectedRows = [...selectedModules, ...selectedDocuments.map((row) => ({ ...row, sourceId: row.id }))];
  const indexableSourceIds = selectedRows.filter((row) => isIndexable(row.enabled, row.indexState, payload.indexingAvailable)).map((row) => row.sourceId);
  const sectionsWithModules = payload.courseSections.map((section) => ({ section, rows: modules.filter((row) => row.sectionId === section.id) })).filter((entry) => entry.rows.length > 0);
  const expanded = expandedSections ?? new Set(sectionsWithModules.filter((entry) => sectionsWithModules.length === 1 || entry.rows.some((row) => row.enabled)).map((entry) => entry.section.id));
  const filtered = filterOverview(filter, sectionsWithModules, payload.items);
  const { visibleSections, visibleModules, visibleCourseDocuments, visibleGlobalDocuments } = filtered;
  const changeFilter = /* @__PURE__ */ __name((query) => {
    setFilter(query);
    if (isFiltering(query)) {
      if (!isFiltering(filter)) {
        expandedBeforeFilterReference.current = expandedSections;
      }
      const matching = filterOverview(query, sectionsWithModules, payload.items).visibleSections;
      setExpandedSections(new Set(matching.map((entry) => entry.section.id)));
    } else if (isFiltering(filter)) {
      setExpandedSections(expandedBeforeFilterReference.current);
    }
  }, "changeFilter");
  const clearSelection = /* @__PURE__ */ __name(() => {
    setSelectedCmIds(/* @__PURE__ */ new Set());
    setSelectedDocumentIds(/* @__PURE__ */ new Set());
  }, "clearSelection");
  const bulkShare = /* @__PURE__ */ __name(async (enabled) => {
    const changed = await share(
      selectedModules.filter((row) => row.enabled !== enabled).map((row) => row.cmId),
      selectedDocuments.filter((row) => row.enabled !== enabled).map((row) => row.id),
      enabled
    );
    if (changed) {
      clearSelection();
    }
  }, "bulkShare");
  const bulkIndex = /* @__PURE__ */ __name(async () => {
    if (await index(indexableSourceIds)) {
      clearSelection();
    }
  }, "bulkIndex");
  const renderModuleRow = /* @__PURE__ */ __name((row) => /* @__PURE__ */ jsxDEV("tr", { children: [
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(
      RowCheckbox,
      {
        id: `module-select-${row.cmId}`,
        name: row.name,
        checked: selectedCmIds.has(row.cmId),
        disabled: saving,
        onChange: () => {
          setSelectedCmIds((current) => setIds(current, [row.cmId], !current.has(row.cmId)));
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 976,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 975,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(
      SourceLabel,
      {
        htmlFor: `module-select-${row.cmId}`,
        iconUrl: row.iconUrl,
        name: row.name,
        details: row.modDisplayName,
        url: row.url
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 987,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 986,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      SharingCells,
      {
        id: `module-enabled-${row.cmId}`,
        name: row.name,
        enabled: row.enabled,
        state: row.indexState,
        indexingAvailable: payload.indexingAvailable,
        disabled: saving,
        onToggle: () => {
          void share([row.cmId], [], !row.enabled);
        },
        onIndex: () => {
          void index([row.sourceId]);
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 995,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(
      PreviewButton,
      {
        name: row.name,
        state: row.indexState,
        onClick: () => {
          void openPreviewModal(row.name, row.sourceId, row.indexState);
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1010,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1009,
      columnNumber: 13
    }, this)
  ] }, row.cmId, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 974,
    columnNumber: 9
  }, this), "renderModuleRow");
  const renderDocumentRow = /* @__PURE__ */ __name((row, scope) => /* @__PURE__ */ jsxDEV("tr", { children: [
    /* @__PURE__ */ jsxDEV("td", { children: row.canEdit && /* @__PURE__ */ jsxDEV(
      RowCheckbox,
      {
        id: `document-select-${row.id}`,
        name: row.name,
        checked: selectedDocumentIds.has(row.id),
        disabled: saving,
        onChange: () => {
          setSelectedDocumentIds((current) => setIds(current, [row.id], !current.has(row.id)));
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1025,
        columnNumber: 21
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1023,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(SourceLabel, { htmlFor: `document-select-${row.id}`, iconUrl: "", name: row.name, details: row.description }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1037,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1036,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      SharingCells,
      {
        id: `document-enabled-${row.id}`,
        name: row.name,
        enabled: row.enabled,
        state: row.indexState,
        indexingAvailable: payload.indexingAvailable,
        disabled: saving || !row.canEdit,
        onToggle: () => {
          void share([], [row.id], !row.enabled);
        },
        onIndex: () => {
          void index([row.id]);
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1039,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { className: "d-flex gap-1", children: [
      /* @__PURE__ */ jsxDEV(
        PreviewButton,
        {
          name: row.name,
          state: row.indexState,
          onClick: () => {
            void openPreviewModal(row.name, row.id, row.indexState);
          }
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 1055,
          columnNumber: 21
        },
        this
      ),
      row.canEdit && /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV(
          DocumentActionButton,
          {
            labelIdentifier: "manager_editsource",
            icon: "fa-pencil",
            variant: "outline-secondary",
            name: row.name,
            disabled: saving,
            onClick: () => {
              const { id, name, description, content } = row;
              void openDocumentModal({
                id,
                scope,
                name,
                description,
                content
              });
            }
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1064,
            columnNumber: 29
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          DocumentActionButton,
          {
            labelIdentifier: "manager_deletesource",
            icon: "fa-trash",
            variant: "outline-danger",
            name: row.name,
            disabled: saving,
            onClick: () => {
              void confirmDeleteDocument(row);
            }
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1077,
            columnNumber: 29
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1063,
        columnNumber: 25
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1054,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1053,
      columnNumber: 13
    }, this)
  ] }, row.id, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 1022,
    columnNumber: 9
  }, this), "renderDocumentRow");
  const renderDocumentGroup = /* @__PURE__ */ __name(({ scope, titleIdentifier, hintIdentifier, emptyIdentifier, rows, canCreate }) => {
    const editableIds = rows.filter((row) => row.canEdit).map((row) => row.id);
    return /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV(GroupHeader, { titleIdentifier, children: canCreate && /* @__PURE__ */ jsxDEV(
        CreateDocumentButton,
        {
          disabled: saving,
          onClick: () => {
            void openDocumentModal({
              id: null,
              scope,
              name: "",
              description: "",
              content: ""
            });
          }
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 1107,
          columnNumber: 25
        },
        this
      ) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1105,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mb-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: hintIdentifier, component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1118,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1117,
        columnNumber: 17
      }, this),
      rows.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: emptyIdentifier, component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1121,
        columnNumber: 60
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1121,
        columnNumber: 21
      }, this),
      rows.length > 0 && /* @__PURE__ */ jsxDEV("table", { className: TABLE_CLASSES, children: [
        /* @__PURE__ */ jsxDEV(
          TableHeader,
          {
            firstColumnIdentifier: "manager_column_document",
            withActions: true,
            checkbox: editableIds.length > 0 && /* @__PURE__ */ jsxDEV(
              SelectAllCheckbox,
              {
                id: `document-select-all-${scope}`,
                ids: editableIds,
                selected: selectedDocumentIds,
                disabled: saving,
                onChange: (ids, select) => {
                  setSelectedDocumentIds((current) => setIds(current, ids, select));
                }
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 1129,
                columnNumber: 33
              },
              this
            )
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1125,
            columnNumber: 25
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("tbody", { children: rows.map((row) => renderDocumentRow(row, scope)) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 1140,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1124,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1104,
      columnNumber: 13
    }, this);
  }, "renderDocumentGroup");
  return /* @__PURE__ */ jsxDEV("div", { className: "local_ai_content-source-manager", children: [
    payload.indexingUnavailableReason !== null && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-info", role: "status", children: /* @__PURE__ */ jsxDEV(
      MoodleString,
      {
        identifier: payload.indexingUnavailableReason === "novecstore" ? "indexingnotavailable_novecstore" : "searchnotavailable",
        component: COMPONENT
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1151,
        columnNumber: 21
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1150,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV(SourceFilter, { id: "local_ai_content-source-manager-filter", onChange: changeFilter }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1160,
      columnNumber: 13
    }, this),
    filtered.noMatch && /* @__PURE__ */ jsxDEV(NoFilterMatch, {}, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1161,
      columnNumber: 34
    }, this),
    filtered.showModules && /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV(GroupHeader, { titleIdentifier: "selector_courseactivities" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1165,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mb-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "manager_activitieshint", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1167,
        columnNumber: 25
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1166,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: TABLE_CLASSES, children: [
        /* @__PURE__ */ jsxDEV(
          TableHeader,
          {
            firstColumnIdentifier: "manager_column_activity",
            withActions: true,
            checkbox: /* @__PURE__ */ jsxDEV(
              SelectAllCheckbox,
              {
                id: "module-select-all",
                ids: visibleModules.map((row) => row.cmId),
                selected: selectedCmIds,
                disabled: saving,
                onChange: (ids, select) => {
                  setSelectedCmIds((current) => setIds(current, ids, select));
                }
              },
              void 0,
              false,
              {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 1174,
                columnNumber: 33
              },
              this
            )
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1170,
            columnNumber: 25
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          sectionsWithModules.length === 0 && visibleModules.map((row) => renderModuleRow(row)),
          visibleSections.map(({ section, rows }) => {
            const ids = rows.map((row) => row.cmId);
            const isExpanded = expanded.has(section.id);
            return /* @__PURE__ */ jsxDEV(Fragment2, { children: [
              /* @__PURE__ */ jsxDEV("tr", { className: "border-top", children: [
                /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(
                  SelectAllCheckbox,
                  {
                    id: `module-select-section-${section.id}`,
                    ids,
                    selected: selectedCmIds,
                    disabled: saving,
                    label: section.name,
                    onChange: (changedIds, select) => {
                      setSelectedCmIds((current) => setIds(current, changedIds, select));
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 1194,
                    columnNumber: 49
                  },
                  this
                ) }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 1193,
                  columnNumber: 45
                }, this),
                /* @__PURE__ */ jsxDEV("td", { colSpan: 5, children: /* @__PURE__ */ jsxDEV(
                  SectionToggle,
                  {
                    name: section.name,
                    expanded: isExpanded,
                    onToggle: () => {
                      setExpandedSections(setIds(expanded, [section.id], !isExpanded));
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 1206,
                    columnNumber: 49
                  },
                  this
                ) }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 1205,
                  columnNumber: 45
                }, this)
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 1192,
                columnNumber: 41
              }, this),
              isExpanded && rows.map((row) => renderModuleRow(row))
            ] }, section.id, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 1191,
              columnNumber: 37
            }, this);
          }),
          modules.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 6, className: "text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "manager_noactivities", component: COMPONENT }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1222,
            columnNumber: 41
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1221,
            columnNumber: 37
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 1220,
            columnNumber: 33
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 1185,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1169,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1164,
      columnNumber: 17
    }, this),
    filtered.showCourseDocuments && renderDocumentGroup({
      scope: "course",
      titleIdentifier: "selector_coursedocuments",
      hintIdentifier: "manager_coursedocumentshint",
      emptyIdentifier: "selector_nocoursedocuments",
      rows: visibleCourseDocuments,
      canCreate: true
    }),
    filtered.showGlobalDocuments && renderDocumentGroup({
      scope: "global",
      titleIdentifier: "selector_globaldocuments",
      hintIdentifier: "manager_globaldocumentshint",
      emptyIdentifier: "selector_noglobaldocuments",
      rows: visibleGlobalDocuments,
      canCreate: payload.canManageGlobalSources
    }),
    error !== null && modalBodyRoot === null && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-danger", role: "alert", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 1248,
      columnNumber: 58
    }, this),
    selectedRows.length > 0 && /* @__PURE__ */ jsxDEV(
      BulkActions,
      {
        count: selectedRows.length,
        total: modules.length + editableDocuments.length,
        shareCount: selectedRows.filter((row) => !row.enabled).length,
        stopSharingCount: selectedRows.filter((row) => row.enabled).length,
        indexCount: indexableSourceIds.length,
        showIndex: [...modules, ...editableDocuments].some((row) => row.enabled && canOfferIndexing(row.indexState, payload.indexingAvailable)),
        disabled: saving,
        onShare: () => {
          void bulkShare(true);
        },
        onStopSharing: () => {
          void bulkShare(false);
        },
        onIndex: () => {
          void bulkIndex();
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1251,
        columnNumber: 17
      },
      this
    ),
    draft !== null && modalBodyRoot !== null && createPortal(
      /* @__PURE__ */ jsxDEV(DocumentForm, { draft, showValidation, error, onChange: setDraft }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 1276,
        columnNumber: 17
      }, this),
      modalBodyRoot
    ),
    preview !== null && previewBodyRoot !== null && createPortal(
      /* @__PURE__ */ jsxDEV(
        IndexedContentPreview,
        {
          preview,
          onPage: (page) => {
            void loadPreviewPage(preview.sourceId, page);
          }
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 1281,
          columnNumber: 17
        },
        this
      ),
      previewBodyRoot
    )
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 1148,
    columnNumber: 9
  }, this);
}
__name(SourceManagerContent, "SourceManagerContent");
export {
  SourceManager as default
};
//# sourceMappingURL=source_manager.dev.js.map

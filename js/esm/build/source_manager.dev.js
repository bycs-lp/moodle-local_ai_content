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
import {
  createDocument,
  deleteDocument,
  getIndexStates,
  getSources,
  indexSources,
  setSharing,
  updateDocument
} from "./source_manager/repository";
import { SectionToggle, SelectedCount, SourceLabel } from "./source_ui";
import { COMPONENT, pluginString, StringsProvider } from "./strings";
import { requireAsync } from "@moodle/lms/core/amd";
import Log from "@moodle/lms/core/log";
import MoodleString from "@moodle/lms/core/String";
import { getString } from "@moodle/lms/core/stringUtils";
const errorMessage = /* @__PURE__ */ __name((caught) => caught instanceof Error ? caught.message : String(caught), "errorMessage");
const isActive = /* @__PURE__ */ __name((state) => state.status === "queued" || state.status === "running", "isActive");
const canOfferIndexing = /* @__PURE__ */ __name((state, indexingAvailable) => indexingAvailable && (!state.hasIndex || state.canIndexCurrentModel && state.currentModel !== null), "canOfferIndexing");
const isIndexable = /* @__PURE__ */ __name((enabled, state, indexingAvailable) => enabled && !isActive(state) && canOfferIndexing(state, indexingAvailable), "isIndexable");
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
      lineNumber: 129,
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
      lineNumber: 154,
      columnNumber: 9
    },
    this
  );
}
__name(RowCheckbox, "RowCheckbox");
function SharingStatus({ state, indexingAvailable, disabled, onIndex }) {
  const active = isActive(state);
  const badgeVariant = state.status === "failed" ? "danger" : state.status === "outdated" ? "warning" : "secondary";
  const indexLabel = use(state.hasIndex && state.currentModel !== null ? pluginString("indexwithmymodel", state.currentModel) : pluginString("makesearchable"));
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    state.hasIndex && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(Badge, { variant: badgeVariant, subtle: badgeVariant === "secondary", label: state.statusLabel }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 185,
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
          lineNumber: 188,
          columnNumber: 29
        },
        this
      ) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 187,
        columnNumber: 25
      }, this),
      state.status === "failed" && state.message !== "" && /* @__PURE__ */ jsxDEV("div", { className: "small text-danger mt-1", children: state.message }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 201,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsxDEV("ul", { className: "list-unstyled small text-muted mt-1 mb-0", children: state.models.map((model) => /* @__PURE__ */ jsxDEV("li", { children: [
        model.model,
        ": ",
        model.statusLabel
      ] }, model.model, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 204,
        columnNumber: 52
      }, this)) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 203,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 184,
      columnNumber: 17
    }, this),
    !state.hasIndex && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(Badge, { variant: "secondary", subtle: true, label: use(pluginString("sharednotsearchable")) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 210,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mt-1", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "sharednotsearchable_desc", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 212,
        columnNumber: 25
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 211,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 209,
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
        lineNumber: 217,
        columnNumber: 17
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 182,
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
        lineNumber: 246,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 245,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("td", { children: enabled && /* @__PURE__ */ jsxDEV(SharingStatus, { state, indexingAvailable, disabled, onIndex }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 257,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 255,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("td", { className: "text-nowrap", children: enabled && state.hasIndex && formatTimestamp(state.lastIndexedAt) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 260,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 244,
    columnNumber: 9
  }, this);
}
__name(SharingCells, "SharingCells");
function TableHeader({ checkbox, firstColumnIdentifier, withActions }) {
  return /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { className: "border-bottom", children: [
    /* @__PURE__ */ jsxDEV("th", { children: checkbox }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 276,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("th", { children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: firstColumnIdentifier, component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 277,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 277,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("th", { children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "manager_column_shared", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 278,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 278,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("th", { children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "status" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 279,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 279,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("th", { children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "manager_column_lastindexed", component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 280,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 280,
      columnNumber: 17
    }, this),
    withActions && /* @__PURE__ */ jsxDEV("th", { children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "actions" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 281,
      columnNumber: 37
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 281,
      columnNumber: 33
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 275,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 274,
    columnNumber: 9
  }, this);
}
__name(TableHeader, "TableHeader");
function GroupHeader({ titleIdentifier, ids, selected, children }) {
  return /* @__PURE__ */ jsxDEV("div", { className: "d-flex align-items-center gap-2 pb-1 mb-2 border-bottom", children: [
    /* @__PURE__ */ jsxDEV("h5", { className: "mb-0 flex-grow-1", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: titleIdentifier, component: COMPONENT }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 298,
      columnNumber: 46
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 298,
      columnNumber: 13
    }, this),
    ids.length > 0 && /* @__PURE__ */ jsxDEV(SelectedCount, { selected: countSelected(ids, selected), total: ids.length }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 299,
      columnNumber: 32
    }, this),
    children
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 297,
    columnNumber: 9
  }, this);
}
__name(GroupHeader, "GroupHeader");
function BulkActions({
  count,
  shareCount,
  stopSharingCount,
  indexCount,
  indexingAvailable,
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
        /* @__PURE__ */ jsxDEV("span", { className: "small text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "bulk_selectedcount", component: COMPONENT, params: count }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 329,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 328,
          columnNumber: 13
        }, this),
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
            lineNumber: 331,
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
            lineNumber: 337,
            columnNumber: 13
          },
          this
        ),
        indexingAvailable && /* @__PURE__ */ jsxDEV(
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
            lineNumber: 344,
            columnNumber: 17
          },
          this
        )
      ]
    },
    void 0,
    true,
    {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 323,
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
        lineNumber: 369,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 368,
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
          lineNumber: 371,
          columnNumber: 17
        },
        this
      ),
      nameInvalid && /* @__PURE__ */ jsxDEV("div", { className: "invalid-feedback", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "required" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 380,
        columnNumber: 67
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 380,
        columnNumber: 33
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 367,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsxDEV("label", { className: "form-label", htmlFor: "local_ai_content-document-description", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "description" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 384,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 383,
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
          lineNumber: 386,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 382,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsxDEV("label", { className: "form-label", htmlFor: "local_ai_content-document-content", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "content" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 397,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 396,
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
          lineNumber: 399,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 395,
      columnNumber: 13
    }, this),
    error !== null && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-danger mb-0", role: "alert", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 409,
      columnNumber: 32
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 366,
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
        lineNumber: 423,
        columnNumber: 24
      }, this),
      label: use(pluginString("manager_createdocument"))
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 419,
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
        lineNumber: 448,
        columnNumber: 24
      }, this)
    },
    void 0,
    false,
    {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 442,
      columnNumber: 9
    },
    this
  );
}
__name(DocumentActionButton, "DocumentActionButton");
function SourceManager(props) {
  return /* @__PURE__ */ jsxDEV(StringsProvider, { children: /* @__PURE__ */ jsxDEV(SourceManagerContent, { ...props }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 462,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 461,
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
  const [draft, setDraft] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [modalBodyRoot, setModalBodyRoot] = useState(null);
  const modalReference = useRef(null);
  const saveDocumentReference = useRef(() => void 0);
  const loggedDebugInfoReference = useRef({});
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
  const share = /* @__PURE__ */ __name(async (cmIds2, documentIds, enabled) => runAction(async () => {
    applyPayload(await setSharing(contextid, cmIds2, documentIds, enabled));
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
  }, []);
  if (!payload) {
    return error === null ? /* @__PURE__ */ jsxDEV("div", { className: "text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "loading" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 676,
      columnNumber: 43
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 676,
      columnNumber: 15
    }, this) : /* @__PURE__ */ jsxDEV("div", { className: "alert alert-danger", role: "alert", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 677,
      columnNumber: 15
    }, this);
  }
  const { modules, courseDocuments, globalDocuments } = payload.items;
  const editableDocuments = [...courseDocuments, ...globalDocuments].filter((row) => row.canEdit);
  const selectedModules = modules.filter((row) => selectedCmIds.has(row.cmId));
  const selectedDocuments = editableDocuments.filter((row) => selectedDocumentIds.has(row.id));
  const selectedRows = [...selectedModules, ...selectedDocuments.map((row) => ({ ...row, sourceId: row.id }))];
  const indexableSourceIds = selectedRows.filter((row) => isIndexable(row.enabled, row.indexState, payload.indexingAvailable)).map((row) => row.sourceId);
  const cmIds = modules.map((row) => row.cmId);
  const sectionsWithModules = payload.courseSections.map((section) => ({ section, rows: modules.filter((row) => row.sectionId === section.id) })).filter((entry) => entry.rows.length > 0);
  const expanded = expandedSections ?? new Set(sectionsWithModules.filter((entry) => sectionsWithModules.length === 1 || entry.rows.some((row) => row.enabled)).map((entry) => entry.section.id));
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
        lineNumber: 724,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 723,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(
      SourceLabel,
      {
        htmlFor: `module-select-${row.cmId}`,
        iconUrl: row.iconUrl,
        name: row.name,
        details: row.modDisplayName
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 735,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 734,
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
        lineNumber: 742,
        columnNumber: 13
      },
      this
    )
  ] }, row.cmId, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 722,
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
        lineNumber: 763,
        columnNumber: 21
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 761,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV(SourceLabel, { htmlFor: `document-select-${row.id}`, iconUrl: "", name: row.name, details: row.description }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 775,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 774,
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
        lineNumber: 777,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("td", { children: row.canEdit && /* @__PURE__ */ jsxDEV("div", { className: "d-flex gap-1", children: [
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
          lineNumber: 794,
          columnNumber: 25
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
          lineNumber: 807,
          columnNumber: 25
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 793,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 791,
      columnNumber: 13
    }, this)
  ] }, row.id, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 760,
    columnNumber: 9
  }, this), "renderDocumentRow");
  const renderDocumentGroup = /* @__PURE__ */ __name(({ scope, titleIdentifier, hintIdentifier, emptyIdentifier, rows, canCreate }) => {
    const editableIds = rows.filter((row) => row.canEdit).map((row) => row.id);
    return /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV(GroupHeader, { titleIdentifier, ids: editableIds, selected: selectedDocumentIds, children: canCreate && /* @__PURE__ */ jsxDEV(
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
          lineNumber: 836,
          columnNumber: 25
        },
        this
      ) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 834,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mb-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: hintIdentifier, component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 847,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 846,
        columnNumber: 17
      }, this),
      rows.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-muted small mb-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: emptyIdentifier, component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 850,
        columnNumber: 60
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 850,
        columnNumber: 21
      }, this),
      rows.length > 0 && /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-hover table-borderless align-middle", children: [
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
                lineNumber: 858,
                columnNumber: 33
              },
              this
            )
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 854,
            columnNumber: 25
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("tbody", { children: rows.map((row) => renderDocumentRow(row, scope)) }, void 0, false, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 869,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 853,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 833,
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
        lineNumber: 880,
        columnNumber: 21
      },
      this
    ) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 879,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV(GroupHeader, { titleIdentifier: "selector_courseactivities", ids: cmIds, selected: selectedCmIds }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 890,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small text-muted mb-2", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "manager_activitieshint", component: COMPONENT }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 892,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 891,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("table", { className: "table table-sm table-hover table-borderless align-middle", children: [
        /* @__PURE__ */ jsxDEV(
          TableHeader,
          {
            firstColumnIdentifier: "manager_column_activity",
            withActions: false,
            checkbox: /* @__PURE__ */ jsxDEV(
              SelectAllCheckbox,
              {
                id: "module-select-all",
                ids: cmIds,
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
                lineNumber: 899,
                columnNumber: 29
              },
              this
            )
          },
          void 0,
          false,
          {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 895,
            columnNumber: 21
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("tbody", { children: [
          sectionsWithModules.length === 0 && modules.map((row) => renderModuleRow(row)),
          sectionsWithModules.map(({ section, rows }) => {
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
                    lineNumber: 919,
                    columnNumber: 45
                  },
                  this
                ) }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 918,
                  columnNumber: 41
                }, this),
                /* @__PURE__ */ jsxDEV("td", { colSpan: 4, children: /* @__PURE__ */ jsxDEV("div", { className: "d-flex align-items-center gap-2", children: [
                  /* @__PURE__ */ jsxDEV(
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
                      lineNumber: 932,
                      columnNumber: 49
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(SelectedCount, { selected: countSelected(ids, selectedCmIds), total: ids.length }, void 0, false, {
                    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                    lineNumber: 939,
                    columnNumber: 49
                  }, this)
                ] }, void 0, true, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 931,
                  columnNumber: 45
                }, this) }, void 0, false, {
                  fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                  lineNumber: 930,
                  columnNumber: 41
                }, this)
              ] }, void 0, true, {
                fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
                lineNumber: 917,
                columnNumber: 37
              }, this),
              isExpanded && rows.map((row) => renderModuleRow(row))
            ] }, section.id, true, {
              fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
              lineNumber: 916,
              columnNumber: 33
            }, this);
          }),
          modules.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 5, className: "text-muted", children: /* @__PURE__ */ jsxDEV(MoodleString, { identifier: "manager_noactivities", component: COMPONENT }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 950,
            columnNumber: 37
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 949,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
            lineNumber: 948,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
          lineNumber: 910,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 894,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 889,
      columnNumber: 13
    }, this),
    renderDocumentGroup({
      scope: "course",
      titleIdentifier: "selector_coursedocuments",
      hintIdentifier: "manager_coursedocumentshint",
      emptyIdentifier: "selector_nocoursedocuments",
      rows: courseDocuments,
      canCreate: true
    }),
    renderDocumentGroup({
      scope: "global",
      titleIdentifier: "selector_globaldocuments",
      hintIdentifier: "manager_globaldocumentshint",
      emptyIdentifier: "selector_noglobaldocuments",
      rows: globalDocuments,
      canCreate: payload.canManageGlobalSources
    }),
    error !== null && modalBodyRoot === null && /* @__PURE__ */ jsxDEV("div", { className: "alert alert-danger", role: "alert", children: error }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
      lineNumber: 975,
      columnNumber: 58
    }, this),
    selectedRows.length > 0 && /* @__PURE__ */ jsxDEV(
      BulkActions,
      {
        count: selectedRows.length,
        shareCount: selectedRows.filter((row) => !row.enabled).length,
        stopSharingCount: selectedRows.filter((row) => row.enabled).length,
        indexCount: indexableSourceIds.length,
        indexingAvailable: payload.indexingAvailable,
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
        lineNumber: 978,
        columnNumber: 17
      },
      this
    ),
    draft !== null && modalBodyRoot !== null && createPortal(
      /* @__PURE__ */ jsxDEV(DocumentForm, { draft, showValidation, error, onChange: setDraft }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
        lineNumber: 998,
        columnNumber: 17
      }, this),
      modalBodyRoot
    )
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_manager.tsx",
    lineNumber: 877,
    columnNumber: 9
  }, this);
}
__name(SourceManagerContent, "SourceManagerContent");
export {
  SourceManager as default
};
//# sourceMappingURL=source_manager.dev.js.map

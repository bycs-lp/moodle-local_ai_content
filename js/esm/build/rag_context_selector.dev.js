var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * React component for selecting sources for a given context.
 *
 * @module     local_ai_content/rag_context_selector
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useState, useEffect } from "react";
import Fetch from "@moodle/lms/core/fetch";
import { Button } from "@moodlehq/design-system";
import { Checkbox } from "@moodlehq/design-system";
const BRIDGE_KEY = "localAiContentRagSelection";
const selectioncache = /* @__PURE__ */ new Map();
function getRagSelectionBridge() {
  const scope = window;
  const existing = scope[BRIDGE_KEY];
  if (existing && typeof existing.getSelected === "function" && typeof existing.getRequestData === "function") {
    return existing;
  }
  const bridge = {
    getSelected(contextid) {
      return selectioncache.get(contextid) ?? "";
    },
    getRequestData(contextid) {
      return { selectedsourceids: selectioncache.get(contextid) ?? "" };
    }
  };
  scope[BRIDGE_KEY] = bridge;
  return bridge;
}
__name(getRagSelectionBridge, "getRagSelectionBridge");
function publishSelected(contextid, selectedsourceids) {
  selectioncache.set(contextid, selectedsourceids);
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
function RagContextSelector({ contextid }) {
  const [availablesources, setAvailablesources] = useState([]);
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const bridge = getRagSelectionBridge();
  useEffect(() => {
    setLoading(true);
    setError(null);
    Fetch.performGet("local_ai_content", `ragcontext/${contextid}`).then((res) => res.json()).then((data) => {
      setAvailablesources(data.availablesources ?? []);
      const selectedsourceids = data.selectedsourceids ?? "";
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
  const handleSave = /* @__PURE__ */ __name(async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    publishSelected(contextid, [...selected].join(","));
    const requestdata = bridge.getRequestData(contextid);
    const res = await Fetch.performPost(
      "local_ai_content",
      `ragcontext/${contextid}`,
      { body: JSON.stringify(requestdata) }
    );
    if (!res.ok) {
      setError(`Failed to save source selection for this context (HTTP ${res.status}).`);
    } else {
      setSaveSuccess(true);
    }
    setSaving(false);
  }, "handleSave");
  useEffect(() => {
    publishSelected(contextid, [...selected].join(","));
  }, [contextid, selected]);
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "rag-context-selector rag-context-selector--loading", children: "Loading..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 193,
      columnNumber: 16
    }, this);
  }
  if (availablesources.length === 0) {
    return /* @__PURE__ */ jsxDEV("div", { className: "rag-context-selector rag-context-selector--empty", children: "No selectable sources found for this context." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 198,
      columnNumber: 13
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "rag-context-selector", children: [
    /* @__PURE__ */ jsxDEV("ul", { className: "rag-context-selector__list list-unstyled", children: availablesources.map((source) => /* @__PURE__ */ jsxDEV("li", { className: "rag-context-selector__item", children: /* @__PURE__ */ jsxDEV(
      Checkbox,
      {
        id: `rag-context-source-${contextid}-${source.id}`,
        checked: selected.has(source.id),
        onChange: () => handleToggle(source.id),
        label: source.name,
        supportingText: source.sourcetype ?? ""
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
        lineNumber: 209,
        columnNumber: 25
      },
      this
    ) }, source.id, false, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 208,
      columnNumber: 21
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 206,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "rag-context-selector__actions mt-2 d-flex align-items-center gap-3", children: [
      /* @__PURE__ */ jsxDEV(
        Button,
        {
          type: "button",
          variant: "primary",
          size: "sm",
          onClick: handleSave,
          disabled: saving,
          label: saving ? "Saving..." : "Save selected sources for this context"
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
          lineNumber: 221,
          columnNumber: 17
        },
        this
      ),
      saveSuccess && /* @__PURE__ */ jsxDEV("span", { className: "text-success small", children: "Saved" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
        lineNumber: 231,
        columnNumber: 21
      }, this),
      error && /* @__PURE__ */ jsxDEV("span", { className: "text-danger small", children: error }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
        lineNumber: 234,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 220,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
    lineNumber: 205,
    columnNumber: 9
  }, this);
}
__name(RagContextSelector, "RagContextSelector");
export {
  RagContextSelector as default
};
//# sourceMappingURL=rag_context_selector.dev.js.map

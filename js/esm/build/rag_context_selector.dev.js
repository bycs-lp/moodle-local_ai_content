var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * React component for selecting RAG context (indexable activities) for a given context.
 *
 * @module     local_ai_content/rag_context_selector
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useState, useEffect } from "react";
import Fetch from "@moodle/lms/core/fetch";
const BRIDGE_KEY = "localAiContentRagSelection";
function getRagSelectionBridge() {
  const scope = window;
  const existing = scope[BRIDGE_KEY];
  if (existing && typeof existing.getSelected === "function" && typeof existing.setSelected === "function") {
    return existing;
  }
  const cache = /* @__PURE__ */ new Map();
  const bridge = {
    setSelected(contextid, ragrecordids) {
      cache.set(contextid, ragrecordids);
    },
    getSelected(contextid) {
      return cache.get(contextid) ?? "";
    }
  };
  scope[BRIDGE_KEY] = bridge;
  return bridge;
}
__name(getRagSelectionBridge, "getRagSelectionBridge");
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
  const [available, setAvailable] = useState([]);
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
      setAvailable(data.available ?? []);
      const selectedraw = data.selected ?? "";
      setSelected(parseIds(selectedraw));
      bridge.setSelected(contextid, selectedraw);
      setLoading(false);
      return data;
    }).catch(() => {
      setError("Failed to load RAG context data.");
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
    const ragrecordids = [...selected].join(",");
    const res = await Fetch.performPost(
      "local_ai_content",
      `ragcontext/${contextid}`,
      { body: JSON.stringify({ ragrecordids }) }
    );
    if (!res.ok) {
      setError(`Failed to save RAG context selection (HTTP ${res.status}).`);
    } else {
      setSaveSuccess(true);
    }
    setSaving(false);
  }, "handleSave");
  useEffect(() => {
    bridge.setSelected(contextid, [...selected].join(","));
  }, [bridge, contextid, selected]);
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "rag-context-selector rag-context-selector--loading", children: "Loading\u2026" }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 174,
      columnNumber: 16
    }, this);
  }
  if (available.length === 0) {
    return /* @__PURE__ */ jsxDEV("div", { className: "rag-context-selector rag-context-selector--empty", children: "No indexable activities found in this course." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 179,
      columnNumber: 13
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "rag-context-selector", children: [
    /* @__PURE__ */ jsxDEV("ul", { className: "rag-context-selector__list list-unstyled", children: available.map((activity) => /* @__PURE__ */ jsxDEV("li", { className: "rag-context-selector__item", children: /* @__PURE__ */ jsxDEV("label", { className: "d-flex align-items-center gap-2", children: [
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "checkbox",
          value: activity.id,
          checked: selected.has(activity.id),
          onChange: () => handleToggle(activity.id),
          className: "form-check-input"
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
          lineNumber: 191,
          columnNumber: 29
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("span", { children: activity.name }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
        lineNumber: 198,
        columnNumber: 29
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 190,
      columnNumber: 25
    }, this) }, activity.id, false, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 189,
      columnNumber: 21
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 187,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "rag-context-selector__actions mt-2 d-flex align-items-center gap-3", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "btn btn-primary btn-sm",
          onClick: handleSave,
          disabled: saving,
          children: saving ? "Saving\u2026" : "Save selection"
        },
        void 0,
        false,
        {
          fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
          lineNumber: 205,
          columnNumber: 17
        },
        this
      ),
      saveSuccess && /* @__PURE__ */ jsxDEV("span", { className: "text-success small", children: "\u2713 Saved" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
        lineNumber: 215,
        columnNumber: 21
      }, this),
      error && /* @__PURE__ */ jsxDEV("span", { className: "text-danger small", children: error }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
        lineNumber: 218,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
      lineNumber: 204,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/rag_context_selector.tsx",
    lineNumber: 186,
    columnNumber: 9
  }, this);
}
__name(RagContextSelector, "RagContextSelector");
export {
  RagContextSelector as default
};
//# sourceMappingURL=rag_context_selector.dev.js.map

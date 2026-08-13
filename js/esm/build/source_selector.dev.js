import { jsxDEV } from "react/jsx-dev-runtime";
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
const BRIDGE_KEY = "localAiContentSourceSelection";
const selectioncache = /* @__PURE__ */ new Map();
const savehandlercache = /* @__PURE__ */ new Map();
function getSourceSelectionBridge() {
  const scope = window;
  const existing = scope[BRIDGE_KEY];
  if (existing && typeof existing.getSelected === "function" && typeof existing.getRequestData === "function" && typeof existing.saveSelection === "function") {
    return existing;
  }
  const bridge = {
    getSelected(contextid) {
      return selectioncache.get(contextid) ?? "";
    },
    getRequestData(contextid) {
      return { selectedSourceIds: selectioncache.get(contextid) ?? "" };
    },
    async saveSelection(contextid) {
      const handler = savehandlercache.get(contextid);
      if (!handler) {
        return false;
      }
      return handler();
    }
  };
  scope[BRIDGE_KEY] = bridge;
  return bridge;
}
function publishSelected(contextid, selectedsourceids) {
  selectioncache.set(contextid, selectedsourceids);
}
function parseIds(raw) {
  if (!raw) {
    return /* @__PURE__ */ new Set();
  }
  return new Set(
    raw.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0)
  );
}
function SourceSelector({ contextid }) {
  const [availablesources, setAvailablesources] = useState([]);
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const bridge = getSourceSelectionBridge();
  useEffect(() => {
    setLoading(true);
    setError(null);
    Fetch.performGet("local_ai_content", `contexts/${contextid}/source-selections`).then((res) => res.json()).then((data) => {
      const item = data.items?.[0] ?? {};
      setAvailablesources(item.availableSources ?? []);
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
  const handleToggle = (id) => {
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
  };
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    publishSelected(contextid, [...selected].join(","));
    const requestdata = bridge.getRequestData(contextid);
    const res = await Fetch.request("local_ai_content", `contexts/${contextid}/source-selections`, {
      method: "PATCH",
      body: requestdata
    });
    if (!res.ok) {
      setError(`Failed to save source selection for this context (HTTP ${res.status}).`);
      setSaving(false);
      return false;
    } else {
      setSaveSuccess(true);
    }
    setSaving(false);
    return true;
  };
  useEffect(() => {
    publishSelected(contextid, [...selected].join(","));
  }, [contextid, selected]);
  useEffect(() => {
    savehandlercache.set(contextid, handleSave);
    return () => {
      savehandlercache.delete(contextid);
    };
  }, [contextid, selected]);
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "source-selector source-selector--loading", children: "Loading..." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 217,
      columnNumber: 16
    }, this);
  }
  if (availablesources.length === 0) {
    return /* @__PURE__ */ jsxDEV("div", { className: "source-selector source-selector--empty", children: "No selectable sources found for this context." }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 222,
      columnNumber: 13
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "source-selector", children: [
    /* @__PURE__ */ jsxDEV("ul", { className: "source-selector__list list-unstyled", children: availablesources.map((source) => /* @__PURE__ */ jsxDEV("li", { className: "source-selector__item", children: /* @__PURE__ */ jsxDEV(
      Checkbox,
      {
        id: `source-selector-source-${contextid}-${source.id}`,
        checked: selected.has(source.id),
        onChange: () => handleToggle(source.id),
        label: source.name,
        supportingText: source.sourcetype ?? ""
      },
      void 0,
      false,
      {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 233,
        columnNumber: 25
      },
      this
    ) }, source.id, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 232,
      columnNumber: 21
    }, this)) }, void 0, false, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 230,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "source-selector__actions mt-2 d-flex align-items-center gap-3", children: [
      saving && /* @__PURE__ */ jsxDEV("span", { className: "text-muted small", children: "Saving..." }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 246,
        columnNumber: 21
      }, this),
      saveSuccess && /* @__PURE__ */ jsxDEV("span", { className: "text-success small", children: "Saved" }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 250,
        columnNumber: 21
      }, this),
      error && /* @__PURE__ */ jsxDEV("span", { className: "text-danger small", children: error }, void 0, false, {
        fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
        lineNumber: 253,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
      lineNumber: 244,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/ai_content/js/esm/src/source_selector.tsx",
    lineNumber: 229,
    columnNumber: 9
  }, this);
}
export {
  SourceSelector as default
};
//# sourceMappingURL=source_selector.dev.js.map

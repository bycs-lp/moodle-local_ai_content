import{requireAsync as r}from"@moodle/lms/core/amd";/**
 * Legacy Moodle modal manager for the source selector React component.
 *
 * @module     local_ai_content/source_selector/source_selection_modal_manager
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const u=async o=>{const n=await r("core/modal_cancel"),d=await r("core/modal_events"),c=n?.default??n,l=d?.default??d,e=await c.create({title:o.title,body:"",large:!0,removeOnClose:!0}),t=e.getRoot(),i='[data-local_ai_content-region="source-selector-modal-body"]';e.setBody('<div data-local_ai_content-region="source-selector-modal-body"></div>');const a=t[0].querySelector(i);return a instanceof HTMLElement?(o.onShown&&t.on(l.shown,o.onShown),o.onHidden&&t.on(l.hidden,o.onHidden),await e.show(),{modal:e,bodyRoot:a}):null},m=async o=>{o&&await o.hide()};export{m as closeSourceSelectorModal,u as openSourceSelectorModal};

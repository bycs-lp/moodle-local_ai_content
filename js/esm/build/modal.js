import{requireAsync as d}from"@moodle/lms/core/amd";import{getString as v}from"@moodle/lms/core/stringUtils";/**
 * Moodle core modals with a mount target for React content.
 *
 * @module     local_ai_content/modal
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const l="local_ai_content-modal-body",m=async o=>{const a=o.saveLabel!==void 0,i=await d(a?"core/modal_save_cancel":"core/modal_cancel"),n=await d("core/modal_events"),e=await i.create({title:o.title,body:"",large:!0,removeOnClose:!0,buttons:a?{save:o.saveLabel}:{cancel:await v("closebuttontitle","core")}}),t=e.getRoot();e.setBody(`<div data-region="${l}"></div>`);const r=t[0].querySelector(`[data-region="${CSS.escape(l)}"]`);return t.on(n.save,s=>{s.preventDefault(),o.onSave?.()}),o.onShown&&t.on(n.shown,o.onShown),o.onHidden&&t.on(n.hidden,o.onHidden),await e.show(),{modal:e,bodyRoot:r}},g=async o=>{await o.hide()};export{g as closeModal,m as openModal};

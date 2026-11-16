import{requireAsync as n}from"@moodle/lms/core/amd";/**
 * Legacy Moodle modal manager for the source selector React component.
 *
 * @module     local_ai_content/source_selector/source_selection_modal_manager
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const s=async o=>{const l=await n("core/modal_cancel"),d=await n("core/modal_events"),a=await n("core/str"),e=await l.create({title:o.title,body:"",large:!0,removeOnClose:!0,buttons:{cancel:await a.getString("closebuttontitle","core")}}),t=e.getRoot();e.setBody('<div data-local_ai_content-region="source-selector-modal-body"></div>');const i=t[0].querySelector('[data-local_ai_content-region="source-selector-modal-body"]');return o.onShown&&t.on(d.shown,o.onShown),o.onHidden&&t.on(d.hidden,o.onHidden),await e.show(),{modal:e,bodyRoot:i}},c=async o=>{await o.hide()};export{c as closeSourceSelectorModal,s as openSourceSelectorModal};

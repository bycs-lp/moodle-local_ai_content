import{COMPONENT as r}from"./strings";import n from"@moodle/lms/core/String";import{jsx as e}from"react/jsx-runtime";/**
 * Preview of the plain text AI features get from a source, e.g. the text extracted from an activity or a file.
 *
 * Independent of where it is shown; the source management renders it into a modal.
 *
 * @module     local_ai_content/content_preview
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */function l({content:i,error:t=null}){return t!==null?e("div",{className:"alert alert-danger mb-0",role:"alert",children:t}):i===null?e("div",{className:"text-muted",children:e(n,{identifier:"preview_loading",component:r})}):i.trim()===""?e("div",{className:"text-muted",children:e(n,{identifier:"preview_empty",component:r})}):e("div",{className:"local_ai_content-content-preview border rounded p-2 bg-light",children:i})}export{l as default};

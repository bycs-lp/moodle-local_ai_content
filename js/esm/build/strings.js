import{Suspense as a,use as i}from"react";import{getComponentStrings as l,getString as s,getStrings as c}from"@moodle/lms/core/stringUtils";import{Fragment as u,jsx as t}from"react/jsx-runtime";/**
 * Preloading of the language strings used by the React UIs of this plugin.
 *
 * Wrap the root of a UI in StringsProvider once; afterwards every use(pluginString(...)) or use(getString(...)) of a
 * preloaded string resolves synchronously, without own Suspense boundaries or state per string.
 *
 * @module     local_ai_content/strings
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const r="local_ai_content",d=["actions","add","back","cancel","content","delete","description","loading","name","required","savechanges","status"];let o=null;const g=()=>(o??=Promise.all([l(r),c(d.map(e=>({key:e,component:"core"}))).catch(()=>null)]),o),P=(e,n)=>s(e,r,n);function p({children:e}){return i(g()),t(u,{children:e})}function N({children:e,fallback:n=null}){return t(a,{fallback:n,children:t(p,{children:e})})}export{r as COMPONENT,N as StringsProvider,P as pluginString};

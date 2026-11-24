import{Suspense as l,use as a}from"react";import{getComponentStrings as i,getString as c,getStrings as s}from"@moodle/lms/core/stringUtils";import{Fragment as u,jsx as o}from"react/jsx-runtime";/**
 * Preloading of the language strings used by the React UIs of this plugin.
 *
 * Wrap the root of a UI in StringsProvider once; afterwards every use(pluginString(...)) or use(getString(...)) of a
 * preloaded string resolves synchronously, without own Suspense boundaries or state per string.
 *
 * @module     local_ai_content/strings
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const t="local_ai_content",d=["add","back","cancel","loading"];let r=null;const g=()=>(r??=Promise.all([i(t),s(d.map(n=>({key:n,component:"core"}))).catch(()=>null)]),r),P=(n,e)=>c(n,t,e);function p({children:n}){return a(g()),o(u,{children:n})}function N({children:n,fallback:e=null}){return o(l,{fallback:e,children:o(p,{children:n})})}export{t as COMPONENT,N as StringsProvider,P as pluginString};

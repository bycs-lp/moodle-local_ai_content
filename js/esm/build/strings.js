import{Suspense as a,use as i}from"react";import{getComponentStrings as s,getString as l,getStrings as c}from"@moodle/lms/core/stringUtils";import{Fragment as g,jsx as t}from"react/jsx-runtime";/**
 * Preloading of the language strings used by the React UIs of this plugin.
 *
 * Wrap the root of a UI in StringsProvider once; afterwards every use(pluginString(...)) or use(getString(...)) of a
 * preloaded string resolves synchronously, without own Suspense boundaries or state per string.
 *
 * @module     local_ai_content/strings
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const r="local_ai_content",d=["actions","add","back","cancel","content","delete","description","loading","name","next","previous","required","savechanges","status"];let o=null;const p=()=>(o??=Promise.all([s(r),c(d.map(e=>({key:e,component:"core"}))).catch(()=>null)]),o),P=(e,n)=>l(e,r,n);function u({children:e}){return i(p()),t(g,{children:e})}function N({children:e,fallback:n=null}){return t(a,{fallback:n,children:t(u,{children:e})})}export{r as COMPONENT,N as StringsProvider,P as pluginString};

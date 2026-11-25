import{use as s}from"react";import{Button as i}from"@moodlehq/design-system";import{COMPONENT as c,pluginString as m}from"./strings";import f from"@moodle/lms/core/String";import{jsx as e,jsxs as r}from"react/jsx-runtime";/**
 * UI parts shared by the source selector and the source management, so both list sources alike.
 *
 * @module     local_ai_content/source_ui
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */function x({selected:a,total:t}){return e("span",{className:"small text-muted text-nowrap",children:e(f,{identifier:"selector_selectedcount",component:c,params:{selected:a,total:t}})})}function N({name:a,expanded:t,controls:n,onToggle:o}){return e(i,{variant:"ghost",className:"flex-grow-1 justify-content-start fw-semibold text-start px-1","aria-expanded":t,"aria-controls":n,title:s(m("selector_toggle",a)),startIcon:e("i",{className:`icon fa fa-fw m-0 fa-chevron-${t?"down":"right"}`,"aria-hidden":"true"}),label:a,onClick:o})}function b({htmlFor:a,iconUrl:t,name:n,details:o,url:l}){return r("label",{htmlFor:a,className:"flex-grow-1 mb-0 d-flex align-items-center gap-2",children:[t===""?e("i",{className:"icon fa fa-file-lines fa-fw m-0","aria-hidden":"true"}):e("img",{src:t,className:"icon activityicon m-0",alt:""}),r("span",{className:"d-flex flex-column",children:[l==null?e("span",{children:n}):e("a",{href:l,children:n}),e("span",{className:"small text-muted",children:o})]})]})}export{N as SectionToggle,x as SelectedCount,b as SourceLabel};

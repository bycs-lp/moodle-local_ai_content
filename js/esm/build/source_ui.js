import{use as l}from"react";import{Button as s}from"@moodlehq/design-system";import{COMPONENT as i,pluginString as c}from"./strings";import m from"@moodle/lms/core/String";import{jsx as e,jsxs as r}from"react/jsx-runtime";/**
 * UI parts shared by the source selector and the source management, so both list sources alike.
 *
 * @module     local_ai_content/source_ui
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */function u({selected:a,total:t}){return e("span",{className:"small text-muted text-nowrap",children:e(m,{identifier:"selector_selectedcount",component:i,params:{selected:a,total:t}})})}function x({name:a,expanded:t,controls:n,onToggle:o}){return e(s,{variant:"ghost",className:"flex-grow-1 justify-content-start fw-semibold text-start px-1","aria-expanded":t,"aria-controls":n,title:l(c("selector_toggle",a)),startIcon:e("i",{className:`icon fa fa-fw m-0 fa-chevron-${t?"down":"right"}`,"aria-hidden":"true"}),label:a,onClick:o})}function N({htmlFor:a,iconUrl:t,name:n,details:o}){return r("label",{htmlFor:a,className:"flex-grow-1 mb-0 d-flex align-items-center gap-2",children:[t===""?e("i",{className:"icon fa fa-file-lines fa-fw m-0","aria-hidden":"true"}):e("img",{src:t,className:"icon activityicon m-0",alt:""}),r("span",{className:"d-flex flex-column",children:[e("span",{children:n}),e("span",{className:"small text-muted",children:o})]})]})}export{x as SectionToggle,u as SelectedCount,N as SourceLabel};

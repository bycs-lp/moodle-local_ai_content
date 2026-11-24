import m from"@moodle/lms/core/fetch";/**
 * Data manager for the source selection of contexts.
 *
 * Single source of truth for the selected sources of a context. ES modules are singletons, so React components
 * importing this module and legacy AMD modules using the shim local_ai_content/source_selector share the same state.
 *
 * @module     local_ai_content/source_selector/data_manager
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const i=new Map,S=new Map,a=new Map,p=new Map,l=new Map,u=e=>{const t=(typeof e=="string"?e.split(","):e).map(n=>Number(String(n).trim())).filter(n=>Number.isSafeInteger(n)&&n>0);return[...new Set(t)]},b=(e,s,t)=>{const n=u(s);a.set(e,n),p.set(e,t.filter(o=>n.includes(o)));for(const o of l.get(e)??[])o([...n])},f=async(e,s=!1)=>{const t=i.get(e);if(t&&!s)return t;const n=m.performGet("local_ai_content",`contexts/${e}/source-selections`).then(async o=>o.json()).then(o=>{const r=o.items[0],c={globalDocuments:r.globalDocuments,courseActivities:r.courseActivities,externalSources:r.externalSources,courseSections:r.courseSections,selectedSourceIds:u(r.selectedSourceIds),fullSourceIds:u(r.fullSourceIds),canSelect:r.canSelect,fullContentWarnChars:r.fullContentWarnChars,fullContentTotalWarnChars:r.fullContentTotalWarnChars};return b(e,c.selectedSourceIds,c.fullSourceIds),c}).catch(o=>{throw i.delete(e),o});return i.set(e,n),n},C=async e=>(a.has(e)||await f(e),[...a.get(e)]),h=async(e,s,t)=>{const n=u(s),o=u(t??p.get(e)??[]).filter(d=>n.includes(d));b(e,n,o);const c=(S.get(e)??Promise.resolve()).catch(()=>{}).then(async()=>m.performPut("local_ai_content",`contexts/${e}/source-selections`,{body:{selectedSourceIds:n.join(","),fullSourceIds:o.join(",")}})).then(()=>{i.delete(e)});return S.set(e,c),c},y=(e,s)=>{const t=l.get(e)??new Set;return t.add(s),l.set(e,t),()=>{t.delete(s),t.size===0&&l.delete(e)}};export{C as getSelectedSourceIds,f as loadSourceSelection,u as parseSourceIds,h as saveSelectedSourceIds,y as subscribe};

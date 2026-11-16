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
 */const c=new Map,a=new Map,u=new Map,i=new Map,l=e=>{const t=(typeof e=="string"?e.split(","):e).map(o=>Number(String(o).trim())).filter(o=>Number.isSafeInteger(o)&&o>0);return[...new Set(t)]},p=(e,s)=>{const t=l(s);u.set(e,t);for(const o of i.get(e)??[])o([...t])},b=async(e,s=!1)=>{const t=c.get(e);if(t&&!s)return t;const o=m.performGet("local_ai_content",`contexts/${e}/source-selections`).then(async n=>n.json()).then(n=>{const r=n.items[0],S={globalDocuments:r.globalDocuments,courseActivities:r.courseActivities,externalSources:r.externalSources,selectedSourceIds:l(r.selectedSourceIds),canSelect:r.canSelect};return p(e,S.selectedSourceIds),S}).catch(n=>{throw c.delete(e),n});return c.set(e,o),o},g=async e=>(u.has(e)||await b(e),[...u.get(e)]),v=async(e,s)=>{const t=l(s);p(e,t);const n=(a.get(e)??Promise.resolve()).catch(()=>{}).then(async()=>m.performPut("local_ai_content",`contexts/${e}/source-selections`,{body:{selectedSourceIds:t.join(",")}})).then(()=>{c.delete(e)});return a.set(e,n),n},y=(e,s)=>{const t=i.get(e)??new Set;return t.add(s),i.set(e,t),()=>{t.delete(s),t.size===0&&i.delete(e)}};export{g as getSelectedSourceIds,b as loadSourceSelection,l as parseSourceIds,v as saveSelectedSourceIds,y as subscribe};

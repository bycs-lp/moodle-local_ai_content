import a from"@moodle/lms/core/fetch";/**
 * Data manager for the source selection of contexts.
 *
 * Single source of truth for the selected sources of a context. ES modules are singletons, so React components
 * importing this module and legacy AMD modules using the shim local_ai_content/source_selector share the same state.
 *
 * @module     local_ai_content/source_selector/data_manager
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const c=new Map,m=new Map,u=new Map,i=new Map,l=e=>{const t=(typeof e=="string"?e.split(","):e).map(o=>parseInt(String(o).trim(),10)).filter(o=>!isNaN(o)&&o>0);return[...new Set(t)]},p=(e,s)=>{const t=l(s);u.set(e,t),i.get(e)?.forEach(o=>o([...t]))},b=(e,s=!1)=>{const t=c.get(e);if(t&&!s)return t;const o=a.performGet("local_ai_content",`contexts/${e}/source-selections`).then(r=>r.json()).then(r=>{const n=r.items[0],S={globalDocuments:n.globalDocuments,courseActivities:n.courseActivities,externalSources:n.externalSources,selectedSourceIds:l(n.selectedSourceIds)};return p(e,S.selectedSourceIds),S}).catch(r=>{throw c.delete(e),r});return c.set(e,o),o},g=async e=>(u.has(e)||await b(e),[...u.get(e)]),v=(e,s)=>{const t=l(s);p(e,t);const r=(m.get(e)??Promise.resolve()).catch(()=>{}).then(()=>a.performPut("local_ai_content",`contexts/${e}/source-selections`,{body:{selectedSourceIds:t.join(",")}})).then(()=>{c.delete(e)});return m.set(e,r),r},f=(e,s)=>{const t=i.get(e)??new Set;return t.add(s),i.set(e,t),()=>{t.delete(s),t.size===0&&i.delete(e)}};export{g as getSelectedSourceIds,b as loadSourceSelection,l as parseSourceIds,v as saveSelectedSourceIds,f as subscribe};

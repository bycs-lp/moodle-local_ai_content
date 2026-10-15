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
 */const c=new Map,m=new Map,u=new Map,i=new Map,l=e=>{const t=(typeof e=="string"?e.split(","):e).map(o=>parseInt(String(o).trim(),10)).filter(o=>!isNaN(o)&&o>0);return[...new Set(t)]},p=(e,r)=>{const t=l(r);u.set(e,t),i.get(e)?.forEach(o=>o([...t]))},b=(e,r=!1)=>{const t=c.get(e);if(t&&!r)return t;const o=a.performGet("local_ai_content",`contexts/${e}/source-selections`).then(s=>s.json()).then(s=>{const n=s.items?.[0]??{},S={globalDocuments:n.globalDocuments??[],courseActivities:n.courseActivities??[],externalSources:n.externalSources??[],selectedSourceIds:l(n.selectedSourceIds??"")};return p(e,S.selectedSourceIds),S}).catch(s=>{throw c.delete(e),s});return c.set(e,o),o},g=async e=>{if(!u.has(e))try{await b(e)}catch{return[]}return[...u.get(e)??[]]},v=(e,r)=>{const t=l(r);p(e,t);const s=(m.get(e)??Promise.resolve()).catch(()=>{}).then(()=>a.performPut("local_ai_content",`contexts/${e}/source-selections`,{body:{selectedSourceIds:t.join(",")}})).then(()=>{c.delete(e)});return m.set(e,s),s},h=(e,r)=>{const t=i.get(e)??new Set;return t.add(r),i.set(e,t),()=>{t.delete(r),t.size===0&&i.delete(e)}};export{g as getSelectedSourceIds,b as loadSourceSelection,l as parseSourceIds,v as saveSelectedSourceIds,h as subscribe};

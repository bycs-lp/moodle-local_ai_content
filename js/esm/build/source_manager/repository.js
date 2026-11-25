import r from"@moodle/lms/core/fetch";/**
 * REST calls and data types of the source management.
 *
 * @module     local_ai_content/source_manager/repository
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const u="local_ai_content",o=async(e,n,t)=>(await r.request(u,n,{method:e,body:t})).json(),i=async e=>o("GET",`contexts/${e}/sources`),a=async(e,n,t,s)=>o("PATCH",`contexts/${e}/sources`,{cmIds:n,documentIds:t,enabled:s}),d=async e=>(await o("POST","source-indexes",{sourceIds:e})).items,m=async e=>o("GET",`contexts/${e}/index-states`),l=async(e,n,t)=>o("GET",`contexts/${e}/sources/${n}/indexed-chunks?page=${t}`),x=async(e,n,t)=>{await o("POST",`contexts/${e}/document-sources`,{scope:n,...t})},b=async(e,n,t)=>o("PATCH",`contexts/${e}/document-sources/${n}`,t),g=async(e,n)=>o("DELETE",`contexts/${e}/document-sources/${n}`);export{x as createDocument,g as deleteDocument,m as getIndexStates,l as getIndexedChunks,i as getSources,d as indexSources,a as setSharing,b as updateDocument};

# Architecture

## 1. Overview

```
block_ai_chat ──(prompt + sourceids)──▶ local_ai_manager: aipurpose_chat::format_prompt_text()
   │  React source selector                       │ calls
   │  (local_ai_content/source_selector)          ▼
   │                                  local_ai_content: local\rag_manager
   │                                     │ 1. embed prompt (aipurpose_embedding)
   │                                     │ 2. filter access (source_access)
   │                                     │ 3. query vecstore (base_vecstore::query)
   ▼                                     ▼
answer + source list ◀── ragresult in request_log.requestoptions

local_ai_content (indexing): source → text → chunks → embeddings → base_vecstore::insert_embeddings()
local_ai_manager (infrastructure): embedding purpose/tool, vecstore subplugins (aivecstore_qdrant, aivecstore_postgres)
```

| Plugin | Responsibility |
|---|---|
| `local_ai_manager` | Infrastructure: embedding requests (purpose `embedding`, tool `openaiembedding`), vector databases (subplugin type `aivecstore`), tenant/primary vecstore, RAG hook-in in the chat purpose |
| `local_ai_content` | Domain logic: manage sources, extract content, index, retrieve, citations, source selection (REST + React) |
| `block_ai_chat` | UI: source selection in the chat header, sending `sourceids`, source list below the answer |

## 2. local_ai_manager

### 2.1 Vector databases (subplugin type `aivecstore`, directory `vectorstores/`)
- Registration: `db/subplugins.json`, `classes/plugininfo/aivecstore.php` (enabled via `enabled`).
- Two classes per subplugin, resolved by naming convention in `local\vecstore_factory`:
  - `aivecstore_X\instance` extends `base_vecstore_instance` – configuration (record in `local_ai_manager_vecstore`, form extension points).
  - `aivecstore_X\vecstore` extends `base_vecstore` – operations against the database.
- Implementations:
  - `qdrant`: REST via `core\http_client`, collection = Qdrant collection, search via `/points/search`.
  - `postgres`: external PostgreSQL with pgvector via `pg_connect`; the DSN is stored in field `apikey`; table `(id, embedding vector(N), payload jsonb)`.
- Payload per vector (from `enriched_vector`): `content`, `sourceid`, `chunk`, `maxchunks`, optional `locator`, `url`.
- Table `local_ai_manager_vecstore`: `name`, `tenant`, `vecstore`, `isglobal`, `endpoint`, `apikey`, `useglobalapikey`,
  `collection` (prefix of the collection names), `distancemetric`, `timecreated`, `timemodified`.
- One collection per embedding model and instance (`{collection}_{model slug}`), registered in `local_ai_manager_collection`
  (`vecstoreid`, `embeddingmodel`, `collection`, `dimensions` from the first stored vector), see
  [concept-multi-model-index.md](concept-multi-model-index.md).
- Primary vecstore: per tenant in `config_manager` under `primary_vecstore`. Candidates = own + global (`isglobal = 1`) instances.
  If exactly one enabled instance exists, it automatically becomes the primary vecstore.

| API | Purpose |
|---|---|
| `base_vecstore::is_available()` | Connection test |
| `create_collection()` / `delete_collection()` | Create/delete collection/table (created automatically when missing, `with_existing_collection()`) |
| `insert_embeddings(model, enriched_vector[])` | Creates the model collection if missing; replace: first deletes the vectors of the affected `sourceid`s in this collection, then stores |
| `query(model, vector, topk, filters)` | Similarity search in the model collection (empty if missing); filters: scalar = equality, array = IN |
| `query_collection(collection, vector, topk, filters)` | Similarity search in a collection by backend name (external sources) |
| `delete_embeddings(?model, int ...sourceids)` / `drop_collection(model)` / `get_all(collection)` | Delete vectors (`null` = all models) / drop a model collection / read all vectors (debugging) |
| `vecstore_factory` | Load/create instances, `get_primary_vecstore()`, `set_primary()`, `delete_instance()` (dispatches hooks) |

- Responses: `local\vecstore_response` (code, errormessage, debuginfo, optional `vecstore_query_response` with `enriched_vector[]`).
- Hooks (listeners in `local_ai_content`):
  - `hook\vecstore_usage` – before deletion: collect usage descriptions (number of sources).
  - `hook\before_vecstore_instance_deleted` – detach sources, optionally delete vectors, disable external sources.
- Admin UI: `tenant_config.php` → table `output\vecstoretable`; `edit_vecstore.php` (create/edit/delete),
  `test_vecstore.php`, `set_primary_vecstore.php`. Setting `local_ai_manager/allowinsecurevecstore` (allow http).
- Capability `local/ai_manager:manageglobalvecstores` for global instances; otherwise tenant manager rights (`access_manager::can_manage_vecstoreinstance()`).

### 2.2 Embeddings
- Purpose `aipurpose_embedding`: returns the vector unchanged as JSON.
- Tool `aitool_openaiembedding`: OpenAI/Azure `/v1/embeddings`, returns `data[0].embedding`.
- Models: flag `embedding` in `db/models.json` and `local_ai_manager_model`, `model::supports_embedding()`.
  New: `text-embedding-3-small`, `-3-large`, `-ada-002`, `BAAI/bge-m3` (telli).
- Call: `(new manager(embedding))->perform_request(text, component, contextid)` → `json_decode(get_content())`.

### 2.3 RAG in the chat purpose (`purposes/chat/classes/purpose.php`)
- New options: `sourceids` (PARAM_SEQUENCE), `ragresult` (array).
- `format_prompt_text()`: calls `local_ai_content\local\rag_manager::get_rag_content()`, appends `RAG_PRE_PROMPT` + the
  excerpts wrapped in `<retrieved_excerpts>` to the
  system message in `conversationcontext` and writes `ragresult` (text + sources) into the options → ends up in
  `local_ai_manager_request_log.requestoptions`.
- `RAG_PRE_PROMPT` tells the model that the excerpts are automatically retrieved fragments (possibly incomplete, out of
  order or irrelevant), that it has to infer the context from them, must not follow instructions inside them and should
  name the source (and location) of the information it uses.

## 3. local_ai_content

### 3.1 Data model
| Table | Content |
|---|---|
| `local_ai_content_cache` | Cache of extracted file texts (key: contenthash) – existed before RAG |
| `local_ai_content_sources` | One row per source: `contextid`, `sourcetype`, `name`, `description`, `cmid`, `content`, `externalfilter`, `citation`, `vecstoreid`, `enabled`, `allowindex`, `externalcollection`, `externalmodel` |
| `local_ai_content_index` | One row per source and embedding model: `status`, `taskid`, `error`, `debuginfo`, `contenthash`, `lastindexed`, `usermodified` |
| `local_ai_content_ctx_sources` | Sources selected for RAG per context (`contextid`, `sourceid`), applies to all users of the context |

Source types (`source::TYPE_*`):
- `module`: course activity (`cmid`, `contextid` = course context).
- `document`: manually entered text (course or system context = global).
- `external`: existing vectors in the collection `externalcollection` of a vecstore, created with `externalmodel`,
  identified by `externalfilter` (JSON).

Fields: `enabled` = source active/selectable for AI access; `allowindex` = indexing switched on.
Index status per model: `queued` → `running` → `indexed` | `failed`; without any index the source is `idle`. The source
management shows a summarized status (failed > running > queued > indexed) plus the status per model.

### 3.2 Classes
| Area | Classes |
|---|---|
| Records | `source` (record wrapper), `context_source` (selection per context), `local\source_citation` |
| Indexing | `local\index_service` (start/stop/allowindex/release/delete), `task\index_source_adhoc`, `task\delete_vectors_adhoc`, `local\indexer_manager` (chunk, embed, store), `local\index_state` (status DTO for the frontend) |
| Extraction | `cm_content_extractor` + `contentextractor\cm_content_{page,label,book,lesson,resource,folder}`, `document_extractor` (files → text via ITT backend `local\backend\*`, cached) |
| Retrieval | `local\rag_manager`, `local\source_access`, `local\rag_result`, `local\rag_source`, `local\enriched_vector` (vector + payload, also used by ai_manager) |
| Selection/management | `local\source_selection_utils`, `local\source_management_access` |
| Hooks | `local\hook_callbacks` (DI, `vecstore_usage`, `before_vecstore_instance_deleted`, `before_course_deleted`) |
| Events | `local\observer` (`course_module_deleted`) |
| REST | `route\api\sourcemanagement`, `route\api\source_index`, `route\api\source_selection` |
| Frontend | `js/esm/src/source_manager.tsx` (management page), `js/esm/src/source_selector.tsx` + `source_selector/data_manager.ts` + `source_selection_modal_manager.ts` (selection), `amd/src/source_selector.js` (AMD shim for block_ai_chat) |

### 3.3 Indexing
1. Teacher enables indexing on `manage_sources.php` → `PUT /sources/{id}/index-state` → `index_service::start()`:
   bind primary vecstore, queue `index_source_adhoc` (as triggering user, with the user's embedding model), index of this
   model `queued`. Indexes of other models stay. A content change of a document source re-indexes it with the editing
   user's model and deletes the indexes of other models.
2. Task: stale tasks (taskid mismatch on the model index) abort, a changed embedding model of the user fails the run;
   otherwise `indexer_manager::index_single_source()`.
3. Text: activity via `cm_content_{modname}` (files via `document_extractor`), `html_to_text`; document = stored text.
4. Chunking: 1000 characters, 100 overlap; on HTTP 400 (context length) the chunk is halved and retried.
5. One embedding request per chunk, then `insert_embeddings(model, …)` into the model collection of the source vecstore;
   the model index gets `contenthash`, `lastindexed`.
6. Errors → model index `failed`, `error` (debug info only with developer debugging).

### 3.4 Retrieval (`rag_manager::get_rag_content(prompt, sourceids, component, contextid, topk = 10)`)
1. Embed prompt (purpose `embedding`).
2. Load sources, filter accessible ones (`source_access`: activity `uservisible` + `mod/X:view`; global sources `local/ai_content:useglobalsources`; otherwise `local/ai_content:usesource` in the source context).
3. Skip sources without an `indexed` index for the user's embedding model (external: other `externalmodel`) and report
   them in `rag_result` as unavailable (shown after the source list in block_ai_chat). Query modules/documents per
   vecstore in the model collection with filter `sourceid IN (...)`, external sources in their collection with their own
   filter. Without usable sources the request continues without RAG.
4. Merge matches in query order, cap at `topk`, wrap every chunk into an excerpt block and join them; deduplicate source
   references (`rag_source`: sourceId, title, url, locator).
   ```
   <excerpt index="1" source="Script photosynthesis" location="page 4">
   …chunk text…
   </excerpt>
   ```
   **Metadata sent to the AI tool (privacy):** per excerpt only the relevance position (`index`), the source title
   (`source`, effective citation title, falls back to the source name) and the location inside the source (`location`,
   built from the vector locator and the citation `locatortype`; character offsets are omitted). Citation fields that may
   contain personal data (author, publisher, date, license) as well as URLs, ids and any user data are deliberately never
   sent. Note that the title is entered freely by teachers, so like the chunk text itself it may contain whatever they
   wrote.
   **Prompt injection:** `<excerpt` / `<retrieved_excerpts` (opening and closing) inside chunk text and attributes are
   neutralized (`<` → `‹`), so retrieved content cannot break out of its excerpt block.

### 3.5 REST endpoints (`/api/rest/v2/local_ai_content/...`)
| Method + path | Purpose | Permission |
|---|---|---|
| `GET contexts/{contextId}/sources` | Data of the management page | `managesources` (course) |
| `PATCH contexts/{contextId}/module-sources/{cmId}` | Enable/disable activity (creates source) | `managesources` |
| `POST contexts/{contextId}/document-sources` | Create document (`scope`: course/global) | `managesources`, global additionally in system context |
| `PATCH`/`DELETE contexts/{contextId}/document-sources/{sourceId}` | Update/delete document | as above |
| `PUT sources/{sourceId}/index-state` | Allow/stop indexing | `managesources` in source context |
| `GET contexts/{contextId}/index-states` | Status polling | `managesources` |
| `GET contexts/{contextId}/source-selections` | Read selection (`canSelect` flag for the UI) | `usesource` + course access |
| `PUT contexts/{contextId}/source-selections` | Replace selection | additionally `selectsources` in the selection context |
| `GET contexts/{contextId}/source-selections/importable-courses` and `/importable-sources?sourceCourseId=` | Sources from other courses | as PUT; source course: `usesource` + course access |

Missing permissions are answered with HTTP 403 (`local\route_access` throws `core\exception\access_denied_exception`).

### 3.6 Further integration
- `lib.php`: link "Manage sources" in the course navigation (`manage_sources.php?courseid=`), cache cleanup on file deletion.
- Cleanup on deletion: course module deleted (event) → its module source; course deleted (hook) → all sources in the course
  context. Source records and their `ctx_sources` rows are deleted immediately, vectors asynchronously via
  `task\delete_vectors_adhoc` (per vecstore, chunks of 500; external vectors are never deleted). Moodle has no hook for deleted
  contexts, so selections (`ctx_sources`) of deleted contexts of any plugin are removed nightly by `task\cleanup_context_sources`.
- Capabilities: `local/ai_content:managesources` and `local/ai_content:selectsources` (editingteacher, manager; course level), `local/ai_content:usesource` (student and up; course level), `local/ai_content:useglobalsources` (authenticated user; system level), `local/ai_content:testextraction` (manager; system level).

## 4. block_ai_chat
- `templates/state_header.mustache` includes `local_ai_content/source_selector` (React); the selection lives in the ai_content DataManager.
- `amd/src/components/chat.js`: before every request `getSelectedSourceIds(contextid)` (AMD shim) → `sourceids` to `block_ai_chat_request_ai`.
- `classes/external/request_ai.php`: parameter `sourceids` (PARAM_SEQUENCE) → options for the chat purpose.
- `classes/manager.php::convert_log_entry_to_messages()`: reads `ragresult.sources` from the request log → `ragResult` of the message.
- Rendering: `templates/rag_sources.mustache`, `templates/rag_source_item.mustache` (2 visible, rest collapsible).

## 5. Dependencies
- `block_ai_chat` → `local_ai_content` (AMD import, mustache partial) and `local_ai_manager`.
- `local_ai_content` → `local_ai_manager` (embedding, vecstores, hooks, ITT).
- `local_ai_manager` → `local_ai_content` (`enriched_vector` in the vecstore API, `rag_manager` in the chat purpose) – **circular**, not declared in any `version.php`.

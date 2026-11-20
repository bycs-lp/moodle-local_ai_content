# Architecture

## 1. Overview

```
block_ai_chat ──(prompt + sourceids)──▶ local_ai_manager: manager::perform_request()
   │  React source selector                       │ dispatches hook\additional_prompt_context
   │  (local_ai_content/source_selector,          ▼
   │   only if local_ai_content is installed)  local_ai_content: local\rag_manager::add_rag_context()
   │                                     │ 1. embed prompt (aipurpose_embedding)
   │                                     │ 2. filter access (source_access)
   │                                     │ 3. query vecstore (base_vecstore::query)
   │                                     │ 4. hook->add_context() / set_result_data('ragresult')
   ▼                                     ▼
answer + source list ◀── contextdata.ragresult in request_log.requestoptions

local_ai_content (indexing): source → text → chunks → embeddings → base_vecstore::insert_embeddings()
local_ai_manager (infrastructure): embedding purpose/tool, vecstore subplugins (aivecstore_qdrant, aivecstore_postgres)
```

| Plugin | Responsibility |
|---|---|
| `local_ai_manager` | Infrastructure: embedding requests (purpose `embedding`, tool `openaiembedding`), vector databases (subplugin type `aivecstore`), tenant/primary vecstore, generic hook to add context to AI requests |
| `local_ai_content` | Domain logic: manage sources, extract content, index, retrieve, citations, source selection (REST + React) |
| `block_ai_chat` | UI: source selection in the chat header, sending `sourceids`, source list below the answer |

## 2. local_ai_manager

### 2.1 Vector databases (subplugin type `aivecstore`, directory `vectorstores/`)
- Registration: `db/subplugins.json`, `classes/plugininfo/aivecstore.php` (enabled via `enabled`).
- Two classes per subplugin, resolved by naming convention in `local\vecstore_factory`:
  - `aivecstore_X\instance` extends `base_vecstore_instance` – configuration (record in `local_ai_manager_vecstore`, form extension points).
    Generic connection fields for all backends: `endpoint`, optional `username` (`uses_username()`), `secret` (API key, token
    or password; label via `get_secret_label()`); backend specific interpretation lives in the subplugin.
  - `aivecstore_X\vecstore` extends `base_vecstore` – operations against the database.
- Implementations:
  - `qdrant`: REST via `core\http_client`, collection = Qdrant collection, search via `/points/search`.
  - `postgres`: external PostgreSQL with pgvector via `pg_connect`; same fields as Qdrant: `endpoint` =
    `postgresql://host:port/database[?sslmode=...]`, `username`, password in `secret`; the libpq connection string is built
    from them on connect (`instance::get_connection_string()`, no credentials in a visible string); table
    `(id, documentid bigint, embedding vector(N), payload jsonb)` with a B-tree index on `documentid`. The document id is
    stored in its own column (not in the payload) in tables created by Moodle; tables of external sources keep it in the
    payload.
- Payload per vector (from `local\vector_record`): `content`, `documentid` (key chosen by the caller, used for replace/delete
  and filters) plus the caller's metadata as flat keys. local_ai_content stores the source id as `documentid` and
  `chunk`, `maxchunks` as metadata; `locator`, `url` are read from the metadata if present (external sources). Qdrant
  creates an integer payload index on `documentid` for every collection.
- Table `local_ai_manager_vecstore`: `name`, `tenant`, `vecstore`, `isglobal`, `endpoint`, `username`, `secret`,
  `collection` (prefix of the collection names), `timecreated`, `timemodified`.
- One collection per embedding model and instance (`{collection}_{model slug}`), registered in `local_ai_manager_collection`
  (`vecstoreid`, `embeddingmodel`, `collection`, `dimensions` from the first stored vector), see
  [concept-multi-model-index.md](concept-multi-model-index.md).
- Primary vecstore: per tenant in `config_manager` under `primary_vecstore`. Candidates = own + global (`isglobal = 1`) instances.
  If exactly one enabled instance exists, it automatically becomes the primary vecstore.

| API | Purpose |
|---|---|
| `base_vecstore::is_available()` | Connection test |
| `create_collection()` / `delete_collection()` | Create/delete collection/table (created automatically when missing, `with_existing_collection()`) |
| `insert_embeddings(model, vector_record[])` | Creates the model collection if missing; replace: first deletes the vectors of the affected `documentid`s in this collection, then stores |
| `query(model, vector, topk, filters)` | Similarity search in the model collection (empty if missing); filters: scalar = equality, array = IN |
| `query_collection(collection, vector, topk, filters)` | Similarity search in a collection by backend name (external sources) |
| `delete_embeddings(?model, int ...documentids)` / `drop_collection(model)` / `get_all(collection)` | Delete vectors (`null` = all models) / drop a model collection / read all vectors (debugging) |
| `vecstore_factory` | Load/create instances, `get_primary_vecstore()`, `set_primary()`, `delete_instance()` (dispatches hooks) |

- Responses: `local\vecstore_response` (code, errormessage, debuginfo, optional `vecstore_query_response` with `vector_record[]`).
  Search matches carry their score (`vector_record::get_score()`, cosine similarity), `null` for other reads (`get_all()`).
- **Similarity metric: cosine only.** All backends measure similarity as cosine similarity, there is no metric setting
  (Postgres: operator `<=>`, score `1 - distance`; Qdrant: collections created with `Cosine`, score = similarity).
  Cosine similarity of the query vector a and a chunk vector b is cos θ = (a·b) / (‖a‖·‖b‖): only the direction of the
  vectors counts, not their length (1 = same direction/meaning, 0 = unrelated). Reasons for not offering dot product or
  euclidean distance:
  - Common embedding models return normalised vectors (length 1). Then dot product = cos θ and
    euclidean distance² = 2 − 2·cos θ, so all three metrics give exactly the same ranking. A choice adds no value.
  - Cosine has a fixed scale (−1 to 1) independent of the vector length, so a minimum similarity
    (`local_ai_content/ragminsimilarity`) can be defined at all. Dot product and euclidean distance depend on the vector
    length as soon as a model does not normalise.
  - One metric makes the scores of all vector stores comparable, so matches of several stores can be ranked globally.
    Mixed metrics would need a re-ranking in PHP.
  - Cosine stays meaningful for non-normalised vectors, is the metric recommended by embedding providers and the default of
    pgvector and Qdrant.

  External collections in Qdrant have to use the `Cosine` distance (Qdrant fixes the metric per collection, other metrics
  return scores with another meaning). pgvector chooses the metric per query, so external tables need nothing.
- Hooks (listeners in `local_ai_content`):
  - `hook\vecstore_usage` – before deletion: collect usage descriptions (number of sources).
  - `hook\before_vecstore_instance_deleted` – detach sources, optionally delete vectors, disable external sources.
- Admin UI: `tenant_config.php` → table `output\vecstoretable`; `edit_vecstore.php` (create/edit/delete),
  `test_vecstore.php`, `set_primary_vecstore.php`. Setting `local_ai_manager/allowinsecurevecstore` (allow http; for Postgres: allow `sslmode` below
  `require`, otherwise encryption is required, checked in the form via `base_vecstore_instance::validate_endpoint()` and again
  when connecting; host and port are checked against the Moodle cURL security settings).
- Capability `local/ai_manager:manageglobalvecstores` for global instances; otherwise tenant manager rights (`access_manager::can_manage_vecstoreinstance()`).

### 2.2 Embeddings
- Purpose `aipurpose_embedding`: returns the vector unchanged as JSON.
- Tool `aitool_openaiembedding`: OpenAI/Azure `/v1/embeddings`, returns `data[0].embedding`.
- Models: flag `embedding` in `db/models.json` and `local_ai_manager_model`, `model::supports_embedding()`.
  New: `text-embedding-3-small`, `-3-large`, `-ada-002`, `BAAI/bge-m3` (telli).
- Call: `(new manager(embedding))->perform_request(text, component, contextid)` → `json_decode(get_content())`.

### 2.3 Adding context to AI requests (hook `hook\additional_prompt_context`)
- Generic option `sourceids` (PARAM_SEQUENCE) for all purposes (`base_purpose`), only evaluated by hook listeners.
- Generic retrieval options `minsimilarity` (PARAM_FLOAT) and `maxretrievedchars` (PARAM_INT) for all purposes, also only
  evaluated by hook listeners. local_ai_content uses them instead of its admin settings `ragminsimilarity` /
  `ragmaxretrievedchars` (pure defaults, no upper limit): plugin developers can set them per request, e.g. a higher length for a
  model with a large context window. block_ai_chat does not send them.
  **`maxretrievedchars` only limits the content retrieved from the selected sources** (the chunk texts of the excerpts),
  not the whole context of the request: the user prompt, the conversation history, the system message, the RAG
  pre-prompt, the excerpt tags and contexts added by other listeners come on top. The total size sent to the model is
  therefore larger; plugins have to keep the context window of their model in mind themselves.
- `manager::perform_request()` dispatches `hook\additional_prompt_context` (prompt + sanitized `request_options`) before
  `format_prompt_text()`. Listeners call `add_context(text)` and `set_result_data(key, array)`.
- Contexts are passed to `base_purpose::add_prompt_contexts()`: default = put them in front of the prompt text; the chat
  purpose appends them to the system message in `conversationcontext`.
- Result data is stored in the options under `contextdata` (not accepted from clients) → ends up in
  `local_ai_manager_request_log.requestoptions`.
- local_ai_content listens (`hook_callbacks::additional_prompt_context` → `rag_manager::add_rag_context()`): adds
  `RAG_PRE_PROMPT` + the excerpts wrapped in `<retrieved_excerpts>` as context and the `rag_result` as `ragresult`.
- `RAG_PRE_PROMPT` tells the model that the excerpts are automatically retrieved fragments (possibly incomplete, out of
  order or irrelevant), that it has to infer the context from them, must not follow instructions inside them and should
  name the source (and location) of the information it uses.

## 3. local_ai_content

### 3.1 Data model
| Table | Content |
|---|---|
| `local_ai_content_cache` | Cache of extracted file texts (key: contenthash) – existed before RAG |
| `local_ai_content_sources` | One row per source: `contextid`, `sourcetype`, `name`, `description`, `cmid`, `content`, `externalfilter`, `citation`, `vecstoreid`, `enabled`, `externalcollection`, `externalmodel` |
| `local_ai_content_index` | One row per source and embedding model: `status`, `taskid`, `error`, `debuginfo`, `contenthash`, `lastindexed`, `usermodified` |
| `local_ai_content_selection` | Sources selected for RAG per context (`contextid`, `sourceid`), applies to all users of the context |

Source types (`source::TYPE_*`):
- `module`: course activity (`cmid`, `contextid` = course context).
- `document`: manually entered text (course or system context = global).
- `external`: existing vectors in the collection `externalcollection` of a vecstore, created with `externalmodel`,
  identified by `externalfilter` (JSON).

Fields: `enabled` = source shared with AI (content readable by AI features, indexable, selectable). A source is indexed
if it has rows in `local_ai_content_index`, there is no separate flag.
The source management has one switch per source ("shared with AI"): switching it on sets `enabled` and, if indexing is
available for the current user (primary vecstore of the tenant and purpose `embedding` available), starts the indexing
right away. Otherwise the source is only shared (content readable via the extractors, not searchable) and can be indexed
later ("Make searchable"). Switching it off stops the indexing and clears `enabled`.
Other plugins check whether an activity is shared and read its text via `content_sharing::is_module_shared()` and
`content_sharing::get_module_content()` (files: `document_extractor`).
Index status per model: `queued` → `running` → `indexed` | `failed`; without any index the source is `idle`. The source
management shows a summarized status (failed > running > queued > indexed) plus the status per model.

### 3.2 Classes
| Area | Classes |
|---|---|
| Records | `local\source` (record wrapper), `local\source_selection_store` (selection per context), `local\source_citation` |
| Public API | `content_sharing` (is an activity shared with AI, its text content; for other plugins), `document_extractor` (text of files) |
| Indexing | `local\index_service` (start/stop/release/delete, indexing availability), `task\index_source_adhoc`, `task\delete_vectors_adhoc`, `local\indexer_manager` (chunk, embed, store), `local\index_state` (status DTO for the frontend) |
| Extraction | `cm_content_extractor` + `contentextractor\cm_content_{page,label,book,lesson,resource,folder}`, `document_extractor` (files → text via ITT backend `local\backend\*`, cached) |
| Retrieval | `local\rag_manager`, `local\search_query_builder`, `local\source_access`, `local\rag_result`, `local\source_reference` |
| Selection/management | `local\source_selection_service`, `local\source_management_service` (module/document sources of a course) |
| Access | `local\access_guard` (enforces capabilities for the current user, HTTP 403), `local\source_access` (may a user retrieve from a source) |
| Hooks | `local\hook_callbacks` (DI, `vecstore_usage`, `before_vecstore_instance_deleted`, `additional_prompt_context`, `before_course_deleted`) |
| Events | `local\observer` (`course_module_deleted`, content change events of the extractors) |
| REST | `route\api\source_management`, `route\api\source_index`, `route\api\source_selection` (thin: access check, request parsing, response; logic in the services; JSON fields in camelCase) |

All services are obtained via DI with constructor injection, no static utilities. Only the record wrappers (`local\source`, `local\model_index`) have static loaders.
| Frontend | `js/esm/src/source_manager.tsx` (management page), `js/esm/src/source_selector.tsx` + `source_selector/data_manager.ts` + `source_selection_modal_manager.ts` (selection), `amd/src/source_selector.js` (AMD shim for block_ai_chat) |

### 3.3 Indexing
1. Teacher shares a source on `manage_sources.php` (`PATCH …/module-sources/{cmId}` or `…/document-sources/{id}`) or
   clicks "Make searchable"/"Index with my embedding model" (`POST /sources/{id}/index`) → `index_service::start()`:
   bind primary vecstore, queue `index_source_adhoc` (as triggering user, with the user's embedding model), index of this
   model `queued`. Indexes of other models stay. A content change of a document source re-indexes it with the editing
   user's model and deletes the indexes of other models.
2. Task: stale tasks (taskid mismatch on the model index) abort, a changed embedding model of the user fails the run;
   otherwise `indexer_manager::index_single_source()`.
3. Text (`local\source_content_reader`): activity via `cm_content_{modname}` (files via `document_extractor`),
   `html_to_text`; document = stored text.
4. Chunking: 1000 characters, 100 overlap; on HTTP 400 (context length) the chunk is halved and retried.
5. One embedding request per chunk, then `insert_embeddings(model, …)` into the model collection of the source vecstore;
   the model index gets `contenthash` (`source_content_reader::get_content_hash()`, computed before the extraction: module
   sources via `cm_content_extractor::get_content_hash()`, documents SHA-256 of the stored text) and `lastindexed`.
6. Errors → model index `failed`, `error` (debug info only with developer debugging).
7. Change detection of activities: every extractor declares the events signalling a change of its content
   (`cm_content_extractor::get_content_change_events()`, default `course_module_updated`; book: chapter events, lesson:
   page events, folder: `folder_updated`). `db/events.php` registers them via `observer::get_content_change_observers()`
   (changes need a version bump). `observer::module_content_changed()` takes the cmid from the event context and calls
   `index_service::queue_module_change_check()`, which queues `check_source_changes_adhoc` (deduplicated) if the module
   has a source with an `indexed` index. The task runs as the user who triggered the event (cron user for events
   without user), computes the current content hash and marks every `indexed` index whose `contenthash` differs as
   `outdated`; it never re-indexes. The content hash of an extractor must change whenever its extraction would change
   (it may change more often). The default hashes the extracted text; extractors with expensive extraction (`resource`,
   `folder`: AI extraction of files) hash the inputs instead (description and its format, path, name and content hash
   of the files), so the check never makes AI requests. Not detected: changes of the extraction logic, extraction
   prompt/model or chunking. Outdated indexes stay searchable (old vectors) until a source manager re-indexes
   them ("Index with my embedding model"). Changes without any event (e.g. direct database changes) are not detected.
   Restoring or importing a backup always creates new course modules without a source, so it does not affect indexes.
   The extraction cache (`local_ai_content_cache`, cleaned by `task\cleanup_cache` after `cachettl` days without access)
   keeps the entries of files in modules with an indexable source, so re-indexing does not repeat the AI extraction.

### 3.4 Retrieval (`rag_manager::get_rag_content(prompt, sourceids, component, contextid, ?minsimilarity, ?maxchars, conversationcontext)`)
1. Load sources, filter accessible ones (`source_access`: activity `uservisible` + `mod/X:view`; global sources `local/ai_content:useglobalsources`; otherwise `local/ai_content:usesource` in the source context).
2. Build the search text (`local\search_query_builder`, only if there are searchable sources, see step 3) and embed it
   (purpose `embedding`). Follow-up messages ("What else does the curriculum say about the second point?") usually do not
   contain the topic they refer to, so embedding only the latest message finds little. `add_rag_context()` therefore passes
   the `conversationcontext` option of the request (chat, agent; system messages are ignored):
   - No conversation history (first message, purposes without conversation): the prompt is embedded unchanged, no
     additional AI request.
   - History and purpose `searchquery` available for the user (`ai_manager_utils::get_ai_config()`: AI tool assigned by the
     tenant manager, purpose enabled, not restricted, request limit not reached): the purpose rewrites the prompt into a
     self-contained search query, using the history including the AI answers (resolves references such as "the second
     point"). The request runs with the component and context of the original request and is logged as `searchquery`
     request (prompt and generated query visible in the request log). It has no request limit by default (internal purpose).
     The purpose passes the conversation as data, not as conversation: one system message with the instructions and the
     history after the line `═════ CONVERSATION HISTORY ═════` (each message after `───── USER ─────` /
     `───── ASSISTANT ─────`, system messages of the caller dropped), the latest message after `═════ LATEST MESSAGE ═════`
     as the only user message. Otherwise models tend to answer the latest message instead of rewriting it and are more
     prone to follow instructions contained in the messages. The separators use box drawing characters, which practically
     never occur in chat messages (unlike Markdown headings), so the messages are not escaped.
     The query is limited to `aipurpose_searchquery\purpose::MAX_QUERY_LENGTH` (500) characters: the system prompt asks
     for at most 50 words (derived from the constant with 10 characters per word, as models cannot count characters
     reliably), `format_output()` returns an empty string for longer outputs (most likely the message was answered
     instead of rewritten; would also risk exceeding the input limit of the embedding model). The builder treats this like
     a failed request.
   - Otherwise, or if the `searchquery` request fails or returns no usable query: fallback to the last two user messages (previous user message +
     prompt, `search_query_builder::FALLBACK_USER_MESSAGES`), joined. Keeps the topic of the previous question, but cannot
     resolve references to the AI answers. A failed `searchquery` request never fails the original request.
   The tenant manager switches the generation on or off by assigning an AI tool to the purpose `searchquery` or not; there is
   no separate setting.
3. Skip sources without an `indexed` index for the user's embedding model (external: other `externalmodel`) and report
   them in `rag_result` as unavailable (shown after the source list in block_ai_chat). Query modules/documents per
   vecstore in the model collection with filter `documentid IN (...)`, external sources in their collection with their own
   filter. Each query returns up to max(30, maximum length / 1000) candidates (`CANDIDATES_PER_QUERY`, chunk size), so
   a large maximum length can be filled. Without usable sources the request continues without RAG.
4. Rank (`rank_matches()`): drop matches below the minimum cosine similarity (request option `minsimilarity`, otherwise
   setting `ragminsimilarity`, default 0.3, 0 = off) and sort the matches of all queries globally by score (comparable,
   see 2.1). Take them in this order until the next chunk would exceed the maximum length (request option
   `maxretrievedchars`, otherwise setting `ragmaxretrievedchars`, default 10000 characters of chunk text, see 2.3); the selection stops
   there, shorter less relevant chunks are not taken instead. Wrap every chunk into an excerpt block and join them;
   deduplicate source
   references (`source_reference`: sourceId, title, url, locator).
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
| `PATCH contexts/{contextId}/module-sources/{cmId}` | Share/stop sharing activity (creates source, indexes if available) | `managesources` |
| `POST contexts/{contextId}/document-sources` | Create document (`scope`: course/global) | `managesources`, global additionally in system context |
| `PATCH`/`DELETE contexts/{contextId}/document-sources/{sourceId}` | Update/delete document | as above |
| `POST sources/{sourceId}/index` | Index with the embedding model of the current user | `managesources` in source context |
| `GET contexts/{contextId}/index-states` | Status polling | `managesources` |
| `GET contexts/{contextId}/source-selections` | Read selection (`canSelect` flag for the UI) | `usesource` + course access |
| `PUT contexts/{contextId}/source-selections` | Replace selection | additionally `selectsources` in the selection context |
| `GET contexts/{contextId}/source-selections/importable-courses` and `/importable-sources?sourceCourseId=` | Sources from other courses | as PUT; source course: `usesource` + course access |

Missing permissions are answered with HTTP 403 (`local\access_guard` throws `core\exception\access_denied_exception`).

### 3.6 Further integration
- `lib.php`: link "Manage sources" in the course navigation (`manage_sources.php?courseid=`), cache cleanup on file deletion.
- Cleanup on deletion: course module deleted (event) → its module source; course deleted (hook) → all sources in the course
  context. Source records and their selection rows are deleted immediately, vectors asynchronously via
  `task\delete_vectors_adhoc` (per vecstore, chunks of 500; external vectors are never deleted). Moodle has no hook for deleted
  contexts, so selections (`local_ai_content_selection`) of deleted contexts of any plugin are removed nightly by `task\cleanup_source_selections`.
- Capabilities: `local/ai_content:managesources` and `local/ai_content:selectsources` (editingteacher, manager; course level), `local/ai_content:usesource` (student and up; course level), `local/ai_content:useglobalsources` (authenticated user; system level), `local/ai_content:testextraction` (manager; system level).

## 4. block_ai_chat
- local_ai_content is optional: `get_initial_state()` sets `static.ragAvailable` if it is installed.
- `amd/src/components/headeractions.js` renders `local_ai_content/source_selector` (React) into the placeholder of
  `templates/state_header.mustache`; the selection lives in the ai_content DataManager.
- `amd/src/components/chat.js`: in chat mode before every request `getSelectedSourceIds(contextid)` (AMD shim, dynamic import)
  → `sourceids` to `block_ai_chat_request_ai`.
- `classes/external/request_ai.php`: parameter `sourceids` (PARAM_SEQUENCE) → request options.
- `classes/manager.php::convert_log_entry_to_messages()`: reads `contextdata.ragresult.sources` from the request log → `ragResult` of the message.
- Rendering: `templates/rag_sources.mustache`, `templates/rag_source_item.mustache` (2 visible, rest collapsible).

## 5. Dependencies
- `block_ai_chat` → `local_ai_manager`; `local_ai_content` optional (source selector, `contextdata.ragresult`).
- `local_ai_content` → `local_ai_manager` (embedding, vecstores, hooks, ITT), declared in `version.php` (minimum version still to
  be set before the release).
- `local_ai_manager` does not know `local_ai_content`.
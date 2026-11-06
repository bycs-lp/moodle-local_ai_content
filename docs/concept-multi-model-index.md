# Parallel indexes per embedding model

Status: implemented (see `issues.md` A10). Content changes of module sources mark their indexes as `outdated` (see
`architecture.md` 3.3, `issues.md` A6).

## Problem
- Vectors of different embedding models must never be compared: with a different dimension RAG fails, with the same
  dimension the matches are silently meaningless.
- The query embedding uses the embedding tool of the requesting user (tenant + role). Course participants from other
  tenants, other roles or a model switch of a tenant would otherwise search source vectors of another model.

## Rules
1. The query embedding always uses the embedding tool of the requesting user (own tenant, own role, own quota).
2. Retrieval only uses the index of a source for exactly this model.
3. There is no on-demand indexing. Indexing is always started by a source manager and uses the embedding model and quota
   of this user.
4. If the requesting user's model has no index of a source, the source is skipped and the answer shows a notice: the
   source is not prepared for the user's model (a source manager with this model can index it) or is being prepared.

**Currently all users must use the same embedding model.** The purpose configuration form rejects different models for
the basic and extended role of the purpose `embedding` (`base_purpose::requires_same_model_for_all_roles()`). Across
tenants the same model has to be configured organisationally. Several models become practical once several models per
purpose can be configured (see "Future").

## Model key
- The model key is the model **name** (`local_ai_manager_model.name`, unique). Names are stable across sites and
  reinstalls, unlike ids.
- Models with the same name behind different connectors are assumed to be identical (same vector space).
- Variants that produce different vectors (e.g. another quantisation) must use a different model name (suffix).

## Data model
### ai_manager: `local_ai_manager_collection`
| Field | Note |
|---|---|
| `vecstoreid` | FK `local_ai_manager_vecstore` |
| `embeddingmodel` | model name |
| `collection` | backend collection/table name `{prefix}_{model slug}`, sanitised, max. 63 chars (hash suffix if longer) |
| `dimensions` | taken from the first stored vector when the collection is created |

Unique (`vecstoreid`, `embeddingmodel`). The vecstore instance keeps connection data and the collection prefix; it has
no `dimensions` field anymore.

### ai_content: `local_ai_content_index`
| Field | Note |
|---|---|
| `sourceid`, `embeddingmodel` | unique together |
| `status` | queued, running, indexed, failed |
| `taskid`, `error`, `debuginfo` | indexing run |
| `contenthash`, `lastindexed` | last successful run |
| `usermodified` | user who started the last run (pays for it) |

`local_ai_content_sources` keeps `vecstoreid` and `allowindex`: all model indexes of a source live in the same vecstore
instance, one collection per model. External sources get `externalcollection` and `externalmodel`.

## Vecstore API (`base_vecstore`)
- `insert_embeddings(string $model, array $embeddings)`: creates and registers the model collection if missing,
  replaces the vectors of the affected `documentid`s (= source ids) in this collection only.
- `query(string $model, array $vector, int $topk, array $filters)`: empty result if the model has no collection yet.
- `query_collection(string $collection, …)`: for external collections.
- `delete_embeddings(?string $model, int ...$documentids)`: `null` = all collections of the instance.
- `drop_collection(string $model)`: drops the collection of a model.
- Subplugins (Qdrant, Postgres) only receive the collection name.

## Indexing (`index_service`)
- **Start** (switch on, new run or "Index with my embedding model"): queues an index task for the model of the current
  user and adds or restarts this model's index. Indexes of other models stay.
- **Content change** (document sources): the source is re-indexed with the model of the editing user; indexes of other
  models are outdated and get deleted. Managers with these models have to index the source again.
- **Content change** (module sources, `course_module_updated`): indexes whose `contenthash` differs from the current
  content are marked `outdated`; they stay searchable until a manager re-indexes them with their model.
- **Stop** (switch off): vectors and indexes of all models are deleted, the source is unbound from its vecstore.
- The task fails if the user's embedding model changed between queuing and running.

## Retrieval (`rag_manager`)
1. Requested sources ∩ context selection ∩ access (unchanged).
2. Determine the model of the requesting user; sources without an `indexed` index for it (external: other
   `externalmodel`) are skipped and reported as unavailable (`indexing` or `othermodel`).
3. One query embedding with the user's own tool; per vecstore query the collection of this model with `documentid` filter.
4. If no source is usable, the request continues without RAG. The notice is shown at the end of the answer after the
   source list (block_ai_chat, `contextdata.ragresult.unavailableSources`).

`source_selection_utils::is_selectable()`: a source is selectable if it is enabled and indexed with at least one model.

## Source management UI
One summarized status per source (failed > running > queued > indexed) plus a list "model: status". If the source is
indexed but not (successfully) for the manager's model, a button "Index with my embedding model" is shown.

## Cleanup
Indexes are never removed because they are unused or their model is no longer configured. All indexes and vectors (all
models) of a source are only removed when the source is deleted (incl. course/module deletion) or its indexing is
switched off. Empty collections may be dropped.

## Future: several embedding models per tenant
When tenant managers can configure several models per purpose and users choose between them, the manager decides per
source whether it is indexed and kept up to date for all available models or only for selected ones:
- Lift the form validation `requires_same_model_for_all_roles()`.
- New table of target models per source (or a flag "all models of the tenant"); the index rows stay unchanged.
- Start/content change: queue one index task per target model.
- "All models": react to adding a model in the tenant config (hook/event needed); removing a model does not delete
  existing indexes (see cleanup).
- Retrieval: the model chosen by the user instead of the configured one; everything else unchanged.

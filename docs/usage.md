# Setup and usage

## 1. Administrators / tenant managers (local_ai_manager)
1. Enable tool `openaiembedding`, create a tool instance with an embedding model (e.g. `text-embedding-3-small`)
   and assign it to purpose `embedding`. **Currently all users must use the same embedding model**: the purpose
   configuration rejects different models for the basic and extended role, and all tenants sharing sources (e.g. course
   participants from other schools) have to configure the same model. Sources are only searchable with the embedding
   model they were indexed with (see [concept-multi-model-index.md](concept-multi-model-index.md)); several models
   become possible once several models per purpose can be configured.
2. Enable a vecstore subplugin (`qdrant` or `postgres`).
3. Tenant configuration → vector databases: create an instance (endpoint/API key or DSN, collection prefix, distance metric).
   One collection per embedding model is created automatically, its dimensions are taken from the first vectors.
   Global instances require `local/ai_manager:manageglobalvecstores`.
4. "Test" checks the connection; "Set as primary" defines the vecstore for new indexing runs.
5. Deleting an instance shows its usage (sources) and offers to delete the vectors as well.

## 2. Teachers (local_ai_content)
1. Course navigation → Manage sources (`/local/ai_content/manage_sources.php?courseid=…`).
2. Activities: "active for AI access" creates the source, "index" queues the adhoc task (cron required). Status is polled.
   Indexing uses your embedding model and quota. The status shows each embedding model the source is indexed with; if
   the source is not indexed with your model yet, "Index with my embedding model" adds an index for it.
   If the content of an indexed activity changes (e.g. settings form, book chapters, lesson pages, folder files; checked
   by cron), the status shows "Content
   changed, re-indexing required"; the old content stays searchable until you re-index it with "Index with my embedding
   model".
3. Documents: create, edit, delete text documents in the course or globally (only with `managesources` in the system context).
   Changed text is re-indexed automatically with your embedding model; indexes of other models are deleted.

## 3. Users (block_ai_chat)
1. Select sources via the sources button in the chat header (indexed, enabled sources; sources from other courses can be imported).
   The selection currently applies to the whole context, not per user.
   Selected sources not indexed with the user's embedding model are skipped; the answer lists them after the sources.
   Sources whose content changed since indexing are marked "Outdated" in the selection; if at least one selected source
   is outdated, a small warning triangle is shown at the sources button (answers may be based on the old content).
2. Every chat request uses the selected sources; the source list with links is shown below the answer.

## 4. Developer tools (not for production)
| Tool | Purpose |
|---|---|
| `local/ai_manager/test_embedding.php` | Test an embedding request (temporary) |
| `local/ai_content/cli/chatrequest.php` | Chat request with fixed sourceids |
| `local/ai_content/cli/showvectors.php` / `wipevectors.php` | Show vectors of the primary vecstore / wipe the collection |
| `local/ai_content/cli/test.php`, `cli/tmp_querycount.php` | Ad-hoc tests, query counting (temporary) |

PHPUnit integration tests of the vecstores only run with a reachable database: `QDRANT_TEST_ENDPOINT` (default `http://qdrant:6333`),
`PGVECTOR_TEST_DSN` (default `postgresql://vectors:vectors@pgvector:5432/vectors`); otherwise they are skipped.

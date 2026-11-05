# Setup and usage

## 1. Administrators / tenant managers (local_ai_manager)
1. Enable tool `openaiembedding`, create a tool instance with an embedding model (e.g. `text-embedding-3-small`, 1536 dimensions)
   and assign it to purpose `embedding`.
2. Enable a vecstore subplugin (`qdrant` or `postgres`).
3. Tenant configuration → vector databases: create an instance (endpoint/API key or DSN, collection, dimensions = model dimensions, distance metric).
   Global instances require `local/ai_manager:manageglobalvecstores`.
4. "Test" checks the connection; "Set as primary" defines the vecstore for new indexing runs.
5. Deleting an instance shows its usage (sources) and offers to delete the vectors as well.

## 2. Teachers (local_ai_content)
1. Course navigation → Manage sources (`/local/ai_content/manage_sources.php?courseid=…`).
2. Activities: "active for AI access" creates the source, "index" queues the adhoc task (cron required). Status is polled.
3. Documents: create, edit, delete text documents in the course or globally (only with `managesources` in the system context).
   Changed text is re-indexed automatically.

## 3. Users (block_ai_chat)
1. Select sources via the sources button in the chat header (indexed, enabled sources; sources from other courses can be imported).
   The selection currently applies to the whole context, not per user.
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

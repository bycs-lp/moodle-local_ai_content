# RAG project (MBS-10900) – documentation

Living project documentation for RAG (retrieval augmented generation) across the plugins `local_ai_manager`,
`local_ai_content` and `block_ai_chat`. Update it with every major change.

| File | Content |
|---|---|
| [architecture.md](architecture.md) | Components, data model, flows, endpoints, dependencies |
| [usage.md](usage.md) | Setup and usage per role, developer tools |

## Status
- Branch `MBS-10900-Implement_RAG` in all three plugins, analysis of 2026-10-16.
- Working mode: draft (upgrade steps, version bumps, privacy, performance review still open).
- The branch also contains commits with other prefixes: `MBS-10716` (ai_content, source management page),
  `MBS-11019` (ai_manager, version.php/test fix).

## Scope of changes (since branch start)
| Plugin | Base commit | Scope |
|---|---|---|
| `local_ai_manager` | `7eb3318` | 60 files, approx. +5200 lines (vecstore subplugins, embedding purpose/tool, chat RAG) |
| `local_ai_content` | `b198cf7` | 71 files, approx. +9800 lines (sources, indexing, retrieval, REST, React UI) |
| `block_ai_chat` | `c3bc465` | 21 files, approx. +200 lines (source selection in the chat, source list in answers) |

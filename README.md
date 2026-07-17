# moodle-local_ai_content

Central text extraction service for Moodle files.

`local_ai_content` extracts text from various file types (plain text, images,
PDFs and office documents) using a configurable AI backend or Moodle's document
converters. Results are cached by content hash to avoid repeated expensive AI
calls, and every extraction is logged for auditing and GDPR compliance.

## Features

- **Unified extraction API** – a single `extractor` service that other plugins
  can consume via the DI container.
- **Pluggable AI backends** – `local_ai_manager` (ITT purpose) or the Moodle
  core AI subsystem, selectable in the plugin settings.
- **Content-hash cache** – identical files share one cache entry; a scheduled
  task cleans up entries that exceed the configured TTL.
- **Usage logging & privacy** – full GDPR provider (export & delete) for the
  usage log.
- **Admin test page** – upload a file and inspect the extraction result,
  metadata and processing log.

## Supported file types

- **Text formats** – read directly, no AI required:
  `text/plain`, `text/html`, `text/xml`, `text/markdown`, `text/rtf`,
  `text/csv`.
- **Images** (PNG, JPEG, WebP, GIF) – via AI image-to-text (ITT), when the
  backend provides ITT.
- **PDF** – via native backend support or page-by-page rendering via Poppler
  `pdftoppm` plus ITT; falls back to a document converter if available.
- **Office documents** – via enabled `core_files` converters. Candidate
  extensions checked: DOC, DOCX, RTF, ODT, XLS, XLSX, ODS, PPT, PPTX, ODP,
  HTML, CSV.
- **Connector-native types** – any additional MIME types the configured AI
  backend declares as natively supported.

The actual availability of images, PDF and office formats depends on the
configured AI backend (ITT capability) and the installed `core_files`
converters. Use the admin test page or `extractor::get_supported_extensions()`
to see what is currently available on your site.

## Usage

```php
$extractor = \core\di::get(\local_ai_content\extractor::class);
$text = $extractor->extract_text_from_file($file, $contextid, $userid, 'your_component');
```

## Error handling

`extract_text_from_file()` follows a strict contract: it returns an **empty
string only when the document genuinely has no extractable content**. Every
actual failure raises a `moodle_exception`. Callers should therefore wrap the
call in a `try/catch` and treat an empty string as “document without content”,
not as an error.

### Returns an empty string (genuine emptiness)

- An empty plain-text file.
- A document that converts successfully but contains no text.
- An image or connector-native file for which the AI returns no text.
- A PDF whose pages are all processed successfully but contain no text.

### Throws a `moodle_exception`

| Situation | Error string |
|-----------|--------------|
| File type not supported by any extraction path | `error_unsupportedfiletype` |
| AI backend unavailable / request failed (image or native type) | `error_ainotavailable`, `error_airequestfailed` |
| Selected backend cannot do image-to-text (e.g. core AI) | `error_ittnotsupported` |
| Document converter cannot convert, does not complete, or yields no file | `error_conversionfailed` |
| PDF rendering produced no pages | `error_conversionfailed` |
| At least one PDF page fails during AI extraction (even on partial success) | the first backend exception |
| PDF page rendering unavailable because `pdftoppm` is not configured/executable | `error_pdfrenderingunavailable` (caught internally, falls back to the converter) |

### Internal fallbacks (no exception surfaced)

- Native PDF extraction failure → falls back to page-by-page image rendering.
- `pdftoppm` unavailable or rendering failure → falls back to the
  `core_files` converter (which then either succeeds or throws
  `error_conversionfailed`).

Successful results are cached; empty results are **not** cached and are
recomputed on the next request.

## Configuration

Site administration → Plugins → Local plugins → **AI Content Manager**:

- **AI backend** – choose the backend used for image/document extraction.
- **Cache lifetime (days)** – how long extracted text is kept before cleanup.
- **Test text extraction** – upload a file to verify the configured backend.

The capability `local/ai_content:useextraction` controls who may use the test
page.

## License

GNU GPL v3 or later.


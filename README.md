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

- Plain text (`text/plain`) – read directly, no AI required.
- Images (PNG, JPEG, WebP, GIF) – via AI image-to-text (ITT), when the backend
  provides ITT.
- PDF – via native backend support or page-by-page rendering (requires the
  `assignfeedback_editpdf` subplugin) plus ITT; falls back to a document
  converter if available.
- Office documents (DOCX, ODT, XLSX, …) – via enabled `core_files` converters.

## Usage

```php
$extractor = \core\di::get(\local_ai_content\extractor::class);
$text = $extractor->extract_text_from_file($file, $contextid, $userid, 'your_component');
```

## Configuration

Site administration → Plugins → Local plugins → **AI Content Manager**:

- **AI backend** – choose the backend used for image/document extraction.
- **Cache lifetime (days)** – how long extracted text is kept before cleanup.
- **Test text extraction** – upload a file to verify the configured backend.

The capability `local/ai_content:useextraction` controls who may use the test
page.

## License

GNU GPL v3 or later.


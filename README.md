# moodle-local_ai_content

Utility and service plugin for AI-related content handling in Moodle.

`local_ai_content` is designed as a reusable foundation for other plugins that
need to process content for AI workflows. It provides shared service interfaces,
centralized processing logic and common operational features (cache, logging,
privacy handling), so consuming plugins do not need to reimplement the same
infrastructure.

At the moment, the plugin ships with one production-ready service:
**text extraction from Moodle files**.

## Positioning

- **Service plugin for other plugins** - not a standalone end-user feature plugin.
- **AI content utility layer** - central place for content preprocessing
  capabilities used by AI-enabled Moodle plugins.

## Currently available service

### Text extraction service

The text extraction service reads textual content from different file types
(plain text, images, PDFs, office documents) using a configurable AI backend
and Moodle document conversion capabilities where required.

Key behavior:

- **Unified extraction API** via `\local_ai_content\extractor`.
- **Pluggable backend selection** (`local_ai_manager` ITT purpose or Moodle core
  AI subsystem, based on plugin settings).
- **Content-hash caching** to avoid repeated expensive extraction runs.
- **Admin test page** to validate extraction behavior for current site config.

## Typical integration

Consumer plugins resolve the service via DI and call the extractor:

```php
$extractor = \core\di::get(\local_ai_content\extractor::class);
$text = $extractor->extract_text_from_file($file, $contextid, $userid, 'your_component');
```

The `your_component` value should identify the caller component for traceability
in logging/auditing.

## Supported file types (text extraction)

- **Text formats** - direct read, no AI required:
  `text/plain`, `text/html`, `text/xml`, `text/markdown`, `text/rtf`,
  `text/csv`.
- **Images** (PNG, JPEG, WebP, GIF) - via AI image-to-text when supported by
  the configured backend.
- **PDF** - via backend-native handling or PDF page rendering (`pdftoppm`) plus
  image-to-text; converter fallback if available.
- **Office documents** - via enabled `core_files` converters. Candidate
  extensions include DOC, DOCX, RTF, ODT, XLS, XLSX, ODS, PPT, PPTX, ODP,
  HTML, CSV.
- **Connector-native types** - additional MIME types declared by the configured
  backend.

Availability depends on backend capabilities and server converter setup. Use the
admin test page or `extractor::get_supported_extensions()` to inspect the
current effective support.

## Error contract (text extraction)

`extract_text_from_file()` returns an empty string **only** when content is
truly empty/unextractable as text, and throws `moodle_exception` for actual
processing failures.

Callers should therefore:

- handle empty string as "no text content" (not an error), and
- use `try/catch` for operational failures.

Representative error strings include:

- `error_unsupportedfiletype`
- `error_ainotavailable`
- `error_airequestfailed`
- `error_ittnotsupported`
- `error_conversionfailed`
- `error_pdfrenderingunavailable`

## Configuration

Site administration -> Plugins -> Local plugins -> **AI Content Manager**:

- **AI backend** - backend used by extraction paths that require AI.
- **Cache lifetime (days)** - retention for extracted text cache entries.
- **Test text extraction** - upload and inspect extraction behavior.

Capability for test page access:

- `local/ai_content:testextraction`

## PDF rendering recommendation

For reliable PDF extraction quality, install Poppler `pdftoppm`.

Debian/Ubuntu:

```bash
sudo apt-get install poppler-utils
```

RHEL/CentOS/Fedora:

```bash
sudo dnf install poppler-utils
```

Configure in:

Site administration -> Server -> System paths -> **Path to pdftoppm**

This maps to `$CFG->pathtopdftoppm`. If not configured, `pdftoppm` is expected
in system `PATH`.

## Roadmap direction

`local_ai_content` is intended to host additional reusable AI content services
in the future (for example, normalization, chunking, metadata enrichment, or
other preprocessing utilities), while keeping a stable service-plugin contract
for consuming plugins.

## License ##

2026, ISB Bayern

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

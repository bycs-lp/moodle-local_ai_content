<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_ai_content;

/**
 * Base class for module content extractors.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
abstract class cm_content_extractor {
    /**
     * Check whether this extractor supports the given course module.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @return bool True if this extractor can handle the module type.
     */
    abstract public function is_cm_supported(\core_course\cm_info $cm): bool;

    /**
     * Extract content from the given course module.
     *
     * Called when indexing a module source by {@see \local_ai_content\task\index_source_adhoc}, running as the user who
     * started the indexing. AI requests needed for the extraction (e.g. text extraction of files via
     * {@see self::extract_content_from_file()}) are made as this user. The change detection does not call this method
     * unless the extractor relies on the default of {@see self::get_content_hash()}.
     *
     * The result must be deterministic (same stored content -> same result, independent of user and time).
     *
     * Changing the implementation so that it returns a different result for unchanged stored content (e.g. other
     * formatting, additional fields) does not invalidate existing indexes by itself: they are only marked outdated if
     * {@see self::get_content_hash()} changes as well. With the default hash (over the result of this method) this happens
     * automatically on the next content change event. Extractors overriding {@see self::get_content_hash()} with a hash
     * over the inputs MUST change their hash as well if all existing extracts should be invalidated, e.g. by adding a
     * version string to the hashed parts and increasing it with every such change:
     *
     * <code>
     * private const HASH_VERSION = '2';
     *
     * #[\Override]
     * public function get_content_hash(\core_course\cm_info $cm): string {
     *     return $this->hash_content_parts([self::HASH_VERSION, ...$this->get_intro_hash_parts($cm), ...]);
     * }
     * </code>
     *
     * In both cases the indexes are only marked outdated on the next content change event of the module, not immediately.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @return string Extracted plain-text content.
     */
    abstract public function extract(\core_course\cm_info $cm): string;

    /**
     * Return a hash identifying the current content of the given course module, used to detect content changes.
     *
     * The hash is stored on the index when indexing and compared with the current hash by the change check after every
     * event returned by {@see self::get_content_change_events()} for a module with an indexed source (see
     * {@see \local_ai_content\local\index_service::check_source_changes()}). The check runs as the user who triggered the
     * event (cron user for events without user).
     *
     * Contract:
     * - The hash MUST change whenever the result of {@see self::extract()} would change, otherwise changes are missed.
     * - It MAY change more often, which only marks the indexes as outdated without a real change.
     * - It must be deterministic (independent of user and time).
     *
     * The default hashes the result of {@see self::extract()}, which is fine for cheap extractions. Extractors with an
     * expensive extraction, especially AI text extraction of files via {@see self::extract_content_from_file()}, MUST
     * override this method and hash the inputs of the extraction instead (e.g. the stored texts and the content hashes of
     * the files, see {@see self::hash_content_parts()}), so the change check never makes AI requests.
     *
     * Changes of the extraction prompt or AI model and of the chunking are not detected. For changes of the extraction
     * logic see {@see self::extract()}.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @return string The SHA-256 hash of the content.
     */
    public function get_content_hash(\core_course\cm_info $cm): string {
        return hash('sha256', $this->extract($cm));
    }

    /**
     * Hash the inputs of an extraction, e.g. stored texts with their formats and content hashes of files.
     *
     * @param string[] $parts The inputs in extraction order.
     * @return string The SHA-256 hash of the parts.
     */
    protected function hash_content_parts(array $parts): string {
        return hash('sha256', json_encode(array_values($parts), JSON_THROW_ON_ERROR));
    }

    /**
     * Return the stored description (intro) of the course module and its format as inputs for
     * {@see self::hash_content_parts()}.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @return string[] The stored description and its format.
     */
    protected function get_intro_hash_parts(\core_course\cm_info $cm): array {
        $instance = $cm->get_instance_record();
        return [(string) $instance->intro, (string) $instance->introformat];
    }

    /**
     * Return the input of {@see self::hash_content_parts()} identifying a file and its content.
     *
     * The path and name are included, as the file type (and therefore the extraction) depends on the file name.
     *
     * @param \stored_file $file The file.
     * @return string Path, name and content hash of the file.
     */
    protected function get_file_hash_part(\stored_file $file): string {
        return $file->get_filepath() . $file->get_filename() . ':' . $file->get_contenthash();
    }

    /**
     * Return the events signalling that content extracted by this extractor may have changed.
     *
     * Whenever one of these events is triggered for a course module with an indexed source, local_ai_content queues a
     * check which compares the current content hash ({@see self::get_content_hash()}) with the one stored on the indexes
     * of the source and marks differing indexes as outdated (see
     * {@see \local_ai_content\local\index_service::check_source_changes()}). The check never re-indexes.
     *
     * The default covers changes made in the settings form of the course module, which trigger
     * {@see \core\event\course_module_updated}. Extractors reading content that can be changed elsewhere (e.g. book
     * chapters, lesson pages, folder files edited on the view page) MUST override this method and add the events of the
     * module signalling these changes, keeping the default events:
     *
     * <code>
     * #[\Override]
     * public static function get_content_change_events(): array {
     *     return array_merge(parent::get_content_change_events(), [
     *         \mod_book\event\chapter_updated::class,
     *     ]);
     * }
     * </code>
     *
     * Requirements for the returned events:
     * - They must be triggered in the context of the course module whose content changed, as the course module is
     *   taken from the event context ({@see \core\event\base::$contextinstanceid}). Events in other contexts are ignored.
     * - They should only signal changes of content this extractor reads: every event costs a cheap database query, and
     *   for modules with an indexed source a call of {@see self::get_content_hash()} as the user who triggered the event.
     *   Triggering an event for a module of another type is harmless, as only modules with a source are checked.
     *
     * The events are registered as observers in db/events.php, which Moodle only reads when it rebuilds its cached
     * observer list (cache core/observers). A change of the returned events (or a new extractor) therefore only takes
     * effect after the caches have been purged. When releasing such a change, bump the version of local_ai_content:
     * admin/cli/upgrade.php only purges the caches if any version has changed, otherwise it exits without purging and
     * the old observers stay registered.
     *
     * Changes that do not trigger any event (e.g. direct database changes) are not detected.
     *
     * @return string[] Fully qualified class names of the events, i.e. subclasses of {@see \core\event\base}.
     */
    public static function get_content_change_events(): array {
        return [\core\event\course_module_updated::class];
    }

    /**
     * Convert a module text field (intro, page content, chapter, ...) from its stored format to HTML.
     *
     * Filters are not applied: their output depends on the viewing user, page and time (e.g. multilang, glossary,
     * dynamic content), which would make the extracted content and its hash unstable. Links and their URLs are dropped
     * by {@see self::format_extracted_cm_content()}, so @@PLUGINFILE@@ placeholders do not need to be rewritten.
     *
     * @param string $text The stored text.
     * @param string $format The stored format of the text (FORMAT_*).
     * @param \core_course\cm_info $cm The course module the text belongs to.
     * @return string The text as HTML.
     */
    protected function format_module_text(string $text, string $format, \core_course\cm_info $cm): string {
        return \core\di::get(\core\formatting::class)->format_text(
            text: $text,
            format: $format,
            context: $cm->context,
            filter: false,
        );
    }

    /**
     * Return the description (intro) of the course module as HTML.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @return string The formatted description, empty if the module has none.
     */
    protected function get_intro(\core_course\cm_info $cm): string {
        $instance = $cm->get_instance_record();
        return trim($this->format_module_text((string) $instance->intro, (string) $instance->introformat, $cm));
    }

    /**
     * Join the description of the course module and the given content parts and normalize them to plain text.
     *
     * @param \core_course\cm_info $cm The course module info object.
     * @param string[] $parts HTML content parts of the module (empty parts are skipped).
     * @return string
     */
    protected function format_with_intro(\core_course\cm_info $cm, array $parts): string {
        $parts = array_filter(
            array_map('trim', [$this->get_intro($cm), ...$parts]),
            fn(string $part): bool => $part !== '',
        );
        return $this->format_extracted_cm_content(implode('<br/><br/>', $parts));
    }

    /**
     * Normalize extracted module content to plain text.
     *
     * @param string $content Extracted content.
     * @return string
     */
    protected function format_extracted_cm_content(string $content): string {
        $content = trim($content);
        if ($content === '') {
            return '';
        }

        return html_to_text($content, 0, false);
    }

    /**
     * Extract text from a stored file using the local_ai_content document extraction.
     *
     * Returns an empty string if the file contains nothing to extract, deciding how to handle that is up to the caller.
     * AI requests needed for the extraction are made as the current user (e.g. the user who started the indexing), not
     * as the author of the file.
     *
     * Files that are not plain text (PDFs, images, ...) are extracted by AI (image to text) if no converter can handle
     * them. Extractors using this method MUST override {@see self::get_content_hash()}, otherwise every content change
     * event re-extracts the files. The extracted text is cached per file content hash, so AI requests are only made for
     * file contents not extracted before or whose cache entry has expired (see {@see \local_ai_content\task\cleanup_cache},
     * which keeps the entries of files in modules with an indexable source).
     *
     * @param \stored_file $file The file to process.
     * @param int $contextid Context id used for AI availability checks.
     * @return string
     * @throws \moodle_exception If the extraction fails.
     */
    protected function extract_content_from_file(\stored_file $file, int $contextid): string {
        global $USER;

        $extractor = \core\di::get(\local_ai_content\document_extractor::class);
        return $extractor->extract_text_from_file($file, $contextid, (int) $USER->id, 'local_ai_content');
    }
}






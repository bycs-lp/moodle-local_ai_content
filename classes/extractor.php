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

use local_ai_content\backend\ai_backend;
use stored_file;

/**
 * Central text extraction service for Moodle files.
 *
 * Extracts text from various file types (plain text, images, PDFs, documents)
 * using AI backends (ITT purpose) or document converters. Results are cached
 * by content hash and usage is logged for audit and GDPR compliance.
 *
 * This class is designed to be resolved through the DI container:
 * $extractor = \core\di::get(\local_ai_content\extractor::class);
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class extractor {
    /** @var string[] Image MIME types that can be sent to AI for text extraction via ITT. */
    private const IMAGE_MIMETYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

    /** @var string[] Text MIME types that can be processed directly. */
    private const TEXT_MIMETYPES = [
        'text/plain',
        'text/html',
        'text/xml',
        'text/markdown',
        'text/rtf',
        'text/csv',
    ];

    /** @var string[] Common document extensions to check for converter support. */
    private const DOCUMENT_EXTENSIONS = [
        'doc', 'docx', 'rtf', 'odt',
        'xls', 'xlsx', 'ods',
        'ppt', 'pptx', 'odp',
        'html', 'csv',
    ];

    /** @var int Log output mode none. */
    const LOG_OUTPUT_NONE = -1;
    /** @var int Log output mode auto (CLI or mtrace). */
    const LOG_OUTPUT_AUTO = 0;
    /** @var int Log output mode echo. */
    const LOG_OUTPUT_ECHO = 1;
    /** @var int Log output mode mtrace. */
    const LOG_OUTPUT_MTRACE = 2;

    /** @var int The log output mode. */
    private int $logoutputmode = self::LOG_OUTPUT_AUTO;
    /** @var string[] The log messages. */
    private array $logmessages = [];

    /**
     * Check whether the current user can test text extraction.
     *
     * @param \context $context The context to check the capability in.
     * @return bool True if the user may test extraction, false otherwise.
     */
    public static function can_test_extraction(\context $context): bool {
        return has_capability('local/ai_content:testextraction', $context);
    }

    /**
     * Check whether the current user can test the text extraction.
     * Throws an exception if not allowed.
     *
     * @param \context $context The context to check the capability in.
     * @return void
     * @throws \moodle_exception If the user does not have the required capability.
     */
    public static function require_can_test_extraction(\context $context): void {
        if (!self::can_test_extraction($context)) {
            throw new \moodle_exception(
                'error_cannottestextraction',
                'local_ai_content',
                '',
                get_string('cannottestextraction', 'local_ai_content')
            );
        }
    }

    /**
     * Log a message if verbose mode is enabled.
     *
     * @param string $message The message to log.
     * @return void
     */
    protected function log($message) {
        // Store the message for later retrieval.
        $this->logmessages[] = $message;

        // Default logging behavior: echo to CLI or mtrace.
        if ($this->logoutputmode === self::LOG_OUTPUT_AUTO) {
            if (CLI_SCRIPT) {
                mtrace($message);
            } else {
                echo $message . "\n";
            }
            return;
        }
        // Force to echo output.
        if ($this->logoutputmode === self::LOG_OUTPUT_ECHO) {
            echo $message . "\n";
        }
        // Force to mtrace output.
        if ($this->logoutputmode === self::LOG_OUTPUT_MTRACE) {
            mtrace($message);
        }
    }

    /**
     * Set the log output mode.
     *
     * @param int $logoutput The log output mode.
     */
    public function set_log_outputmode(int $logoutputmode) {
        $this->logoutputmode = $logoutputmode;
    }
    /**
     * Get the log output mode.
     * @return int The log output mode.
     */
    public function get_log_outputmode(): int {
        return $this->logoutputmode;
    }
    /**
     * Get the log messages.
     * @return array The log messages.
     */
    public function get_log_messages(): array {
        return $this->logmessages;
    }

    /**
     * Extract text content from a stored file.
     *
     * Dispatches to the appropriate extraction method based on MIME type:
     * - Plain text files: read directly.
     * - Images (PNG, JPEG, WebP, GIF): AI image-to-text (ITT purpose).
     * - PDFs: native AI support or page-by-page rendering + ITT.
     * - Documents (DOCX, ODT, etc.): core_files converter.
     *
     * Results are cached by content hash to avoid repeated expensive AI calls.
     *
     * @param stored_file $file The file to extract text from.
     * @param int $contextid The context ID for AI availability checks.
     * @param int|null $userid The user to attribute the extraction to (quota, audit).
     *                         Null for system context (e.g. cron cleanup).
     * @param string $component The calling plugin component name (e.g. 'assignfeedback_aif').
     * @return string The extracted text content. Empty string only if the document has no
     *                extractable content.
     * @throws \moodle_exception If the file type is not supported or extraction fails.
     */
    public function extract_text_from_file(
        stored_file $file,
        int $contextid,
        ?int $userid = null,
        string $component = ''
    ): string {
        if (!$this->is_file_supported($file)) {
            throw new \moodle_exception(
                'error_unsupportedfiletype',
                'local_ai_content',
                '',
                $file->get_mimetype()
            );
        }

        $contenthash = $file->get_contenthash();
        $mimetype = $file->get_mimetype();

        // Check cache first.
        $cached = $this->get_from_cache($contenthash);
        if ($cached !== null) {
            $this->log("local_ai_content: Using cached content for '{$file->get_filename()}'.");
            return $cached;
        }

        // Extract based on MIME type.
        $content = $this->extract_by_mimetype($file, $mimetype, $contextid, $userid);

        // Cache the result.
        if (!empty($content)) {
            $this->store_to_cache($contenthash, $content);
        }

        return $content;
    }

    /**
     * Check whether a stored file's type is supported for text extraction.
     *
     * A file is supported if at least one extraction path exists:
     * - Plain text: always supported (read directly, no AI needed).
     * - Images/PDF: supported if the AI backend has ITT configured.
     * - Connector-native types: supported if the backend declares them.
     * - Convertible types: supported if a core_files converter can handle them.
     *
     * @param stored_file $file The file to check.
     * @return bool True if the file type can be processed.
     */
    public function is_file_supported(stored_file $file): bool {
        $mimetype = $file->get_mimetype();

        // Plain text: always supported, no AI needed.
        if (in_array($mimetype, self::TEXT_MIMETYPES)) {
            return true;
        }

        // AI backend support: images and PDFs require ITT capability.
        $backend = $this->get_backend();
        if ($backend->is_itt_available()) {
            // Standard ITT input: every ITT connector can process images.
            if (in_array($mimetype, self::IMAGE_MIMETYPES)) {
                return true;
            }
            // PDF: extractable via page-by-page rendering (Ghostscript) + ITT.
            if ($mimetype === 'application/pdf') {
                return true;
            }
        }

        // Additional types natively supported by the backend's connector.
        // Separate from ITT check: a backend may support specific MIME types
        // natively without providing general ITT capability.
        if ($backend->is_mimetype_natively_supported($mimetype)) {
            return true;
        }

        // Document converter support (DOCX, ODT, etc. — also PDF fallback if converter exists).
        $converter = new \core_files\converter();
        if ($converter->can_convert_storedfile_to($file, 'txt')) {
            return true;
        }

        return false;
    }

    /**
     * Get a formatted list of all file extensions supported for text extraction.
     *
     * Collects supported formats from three sources:
     * - Always available: txt (plain text, no AI needed).
     * - AI backend ITT: images, PDF, and connector-declared MIME types.
     * - Document converter: common document formats convertible to txt.
     *
     * @return string Comma-separated list of uppercase extensions (e.g. "DOC, DOCX, PDF, PNG, TXT").
     */
    public function get_supported_extensions(): string {
        // Plain text is always supported.
        $mimetypes = self::TEXT_MIMETYPES;

        // Add AI backend types if ITT is available.
        $backend = $this->get_backend();
        if ($backend->is_itt_available()) {
            $mimetypes = array_merge($mimetypes, self::IMAGE_MIMETYPES);
            $mimetypes[] = 'application/pdf';
        }

        // Add types natively supported by the backend's connector.
        $mimetypes = array_merge($mimetypes, $backend->get_natively_supported_mimetypes());

        // Convert MIME types to file extensions.
        $mimetypes = array_unique($mimetypes);
        $typesarray = get_mimetypes_array();
        $extensions = [];
        foreach ($mimetypes as $mimetype) {
            foreach ($typesarray as $ext => $info) {
                if ($info['type'] === $mimetype) {
                    $extensions[] = strtoupper($ext);
                    break;
                }
            }
        }

        // Add document formats supported by enabled converter plugins.
        $converter = new \core_files\converter();
        foreach (self::DOCUMENT_EXTENSIONS as $ext) {
            if ($converter->can_convert_format_to($ext, 'txt')) {
                $extensions[] = strtoupper($ext);
            }
        }

        $extensions = array_unique($extensions);
        sort($extensions);
        return implode(', ', $extensions);
    }


    /**
     * Get the configured AI backend instance via DI.
     *
     * @return ai_backend The active AI backend.
     */
    private function get_backend(): ai_backend {
        return \core\di::get(ai_backend::class);
    }

    /**
     * Dispatch extraction to the appropriate handler based on MIME type.
     *
     * @param stored_file $file The file to extract text from.
     * @param string $mimetype The MIME type of the file.
     * @param int $contextid The context ID for AI requests.
     * @param int|null $userid The user ID for AI quota attribution.
     * @return string The extracted text.
     * @throws \moodle_exception If extraction fails.
     */
    private function extract_by_mimetype(
        stored_file $file,
        string $mimetype,
        int $contextid,
        ?int $userid
    ): string {
        // Plain text: read directly.
        if (in_array($mimetype, self::TEXT_MIMETYPES)) {
            return $this->extract_from_text_file($file);
        }

        // Images: AI image-to-text (ITT).
        if (in_array($mimetype, self::IMAGE_MIMETYPES)) {
            return $this->extract_from_image($file, $contextid, $userid);
        }

        // PDF: native AI support or page-by-page rendering.
        if ($mimetype === 'application/pdf') {
            return $this->extract_from_pdf($file, $contextid, $userid);
        }

        // Check if backend handles this type natively.
        $backend = $this->get_backend();
        if ($backend->is_mimetype_natively_supported($mimetype)) {
            $encodeddata = 'data:' . $mimetype . ';base64,' . base64_encode($file->get_content());
            return $this->retrieve_text_from_ai($encodeddata, $contextid, $userid);
        }

        // Documents: core_files converter.
        return $this->extract_via_converter($file);
    }

    /**
     * Extract text from a plain text file by reading its content directly.
     *
     * @param stored_file $file The text file.
     * @return string The file content.
     */
    private function extract_from_text_file(stored_file $file): string {
        $content = $file->get_content();
        $this->log("local_ai_content: Text content from '{$file->get_filename()}' read directly.");
        return $content;
    }

    /**
     * Extract text from an image file using AI image-to-text (ITT).
     *
     * Encodes the image as base64 and sends it to the AI backend with a prompt
     * requesting the text content of the image.
     *
     * @param stored_file $file The image file.
     * @param int $contextid The context ID for AI requests.
     * @param int|null $userid The user ID for quota attribution.
     * @return string The extracted text.
     * @throws \moodle_exception If the AI request fails.
     */
    private function extract_from_image(stored_file $file, int $contextid, ?int $userid): string {
        $encodedimage = 'data:' . $file->get_mimetype() . ';base64,' . base64_encode($file->get_content());
        $content = $this->retrieve_text_from_ai($encodedimage, $contextid, $userid);
        $this->log("local_ai_content: Text extracted from image '{$file->get_filename()}' via ITT.");
        return $content;
    }

    /**
     * Extract text from a PDF file.
     *
     * First checks if the AI backend supports PDF natively (e.g. Gemini).
     * If so, sends the entire PDF as a base64 data URL in a single request.
     * Otherwise, falls back to rendering each page as an image via pdftoppm
     * and sending images individually via ITT.
     *
     * @param stored_file $file The PDF file.
     * @param int $contextid The context ID for AI requests.
     * @param int|null $userid The user ID for quota attribution.
     * @return string The combined extracted text from all pages.
     * @throws \moodle_exception If extraction fails completely.
     */
    private function extract_from_pdf(stored_file $file, int $contextid, ?int $userid): string {
        $backend = $this->get_backend();

        // Try native PDF support if the AI backend handles it directly.
        if ($backend->is_mimetype_natively_supported('application/pdf')) {
            try {
                $encodedpdf = 'data:application/pdf;base64,' . base64_encode($file->get_content());
                $content = $this->retrieve_text_from_ai($encodedpdf, $contextid, $userid);
                if (!empty($content)) {
                    $this->log("local_ai_content: Text extracted from PDF '{$file->get_filename()}' via native PDF support.");
                    return $content;
                }
            } catch (\Exception $e) {
                $this->log("local_ai_content: Native PDF extraction failed for '{$file->get_filename()}': "
                    . $e->getMessage() . " — falling back to page-by-page rendering.");
            }
        }

        // Fall back to page-by-page image rendering.
        try {
            $encodedimages = $this->convert_pdf_to_images($file);
        } catch (\Exception $e) {
            $this->log("local_ai_content: Failed to convert PDF '{$file->get_filename()}' to images: " . $e->getMessage());
            // Fallback: try core_files converter.
            return $this->extract_via_converter($file);
        }

        // No renderable pages is a processing failure, not an empty document.
        if (empty($encodedimages)) {
            throw new \moodle_exception('error_conversionfailed', 'local_ai_content', '', $file->get_filename());
        }

        $content = '';
        $pagenum = 0;
        $firsterror = null;
        foreach ($encodedimages as $encodedimage) {
            $pagenum++;
            try {
                $pagetext = $this->retrieve_text_from_ai($encodedimage, $contextid, $userid);
                $content .= $pagetext . "\n";
                $this->log("local_ai_content: Extracted text from PDF page {$pagenum}/" . count($encodedimages) . ".");
            } catch (\Exception $e) {
                $this->log("local_ai_content: Failed to extract text from PDF page {$pagenum}: " . $e->getMessage());
                if ($firsterror === null) {
                    $firsterror = $e;
                }
            }
        }

        // Any page failure is an extraction error, even if other pages produced text.
        if ($firsterror !== null) {
            throw $firsterror;
        }

        return trim($content);
    }

    /**
     * Convert a PDF file into an array of base64-encoded page images.
     *
     * Uses Poppler's pdftoppm binary to render each page to PNG.
     *
     * @param stored_file $file The PDF file.
     * @return string[] Array of base64-encoded data URLs, one per page.
     * @throws \moodle_exception If pdftoppm is unavailable or the PDF cannot be processed.
     */
    private function convert_pdf_to_images(stored_file $file): array {
        global $CFG;

        $pdftoppm = 'pdftoppm';
        if (!empty($CFG->pathtopdftoppm)) {
            if (!is_executable($CFG->pathtopdftoppm)) {
                throw new \moodle_exception('error_pdfrenderingunavailable', 'local_ai_content');
            }
            $pdftoppm = $CFG->pathtopdftoppm;
        }

        $tmpdir = \make_request_directory();
        $tmppdfpath = $tmpdir . '/source.pdf';
        $outputprefix = $tmpdir . '/page';
        $file->copy_content_to($tmppdfpath);

        $command = \escapeshellarg($pdftoppm)
            . ' -q -r 150 -png '
            . \escapeshellarg($tmppdfpath)
            . ' '
            . \escapeshellarg($outputprefix);
        $output = [];
        $result = 0;
        exec($command, $output, $result);

        if ($result !== 0) {
            throw new \moodle_exception('error_pdfrenderingunavailable', 'local_ai_content');
        }

        $images = glob($outputprefix . '-*.png') ?: [];
        sort($images, SORT_NATURAL);

        if (empty($images)) {
            throw new \moodle_exception('error_conversionfailed', 'local_ai_content', '', $file->get_filename());
        }

        $imagearray = [];
        foreach ($images as $imagepath) {
            $imagecontent = file_get_contents($imagepath);
            if ($imagecontent === false) {
                throw new \moodle_exception('error_conversionfailed', 'local_ai_content', '', $file->get_filename());
            }
            $imagemime = 'image/png';
            $imagearray[] = 'data:' . $imagemime . ';base64,' . base64_encode($imagecontent);
        }

        return $imagearray;
    }

    /**
     * Extract text from a file using the core_files converter (e.g. DOCX to TXT).
     *
     * @param stored_file $file The file to convert.
     * @return string The extracted text. Empty string only if the document has no content.
     * @throws \moodle_exception If the conversion cannot be performed.
     */
    private function extract_via_converter(stored_file $file): string {
        $converter = new \core_files\converter();
        $format = 'txt';

        if (!$converter->can_convert_storedfile_to($file, $format)) {
            throw new \moodle_exception('error_conversionfailed', 'local_ai_content', '', $file->get_mimetype());
        }

        $conversion = $converter->start_conversion($file, $format);
        $this->log("local_ai_content: Converting '{$file->get_filename()}' to TXT.");

        if ($conversion->get('status') !== \core_files\conversion::STATUS_COMPLETE) {
            throw new \moodle_exception('error_conversionfailed', 'local_ai_content', '', $file->get_filename());
        }

        $convertedfile = $conversion->get_destfile();
        if (!$convertedfile) {
            throw new \moodle_exception('error_conversionfailed', 'local_ai_content', '', $file->get_filename());
        }

        $text = $convertedfile->get_content();

        $this->log("local_ai_content: Content from '{$file->get_filename()}' converted successfully.");
        return $text;
    }

    /**
     * Send an encoded image/document to the AI backend for text extraction (ITT purpose).
     *
     * Switches the user context for quota attribution before the AI request
     * and restores the original context afterwards.
     *
     * @param string $encodeddata Base64-encoded data URL of the image or document.
     * @param int $contextid The context ID for the AI request.
     * @param int|null $userid The user ID for quota attribution.
     * @return string The extracted text from the AI response.
     * @throws \moodle_exception If the AI request fails.
     */
    private function retrieve_text_from_ai(string $encodeddata, int $contextid, ?int $userid): string {
        $imageprompt = get_config('local_ai_content', 'extractionprompt');

        // Switch user context for quota attribution.
        $previoususerid = $this->setup_user($userid);

        try {
            $backend = $this->get_backend();
            $result = $backend->extract_text_from_encoded_data($imageprompt, $encodeddata, $contextid);
        } finally {
            // Always restore previous user context.
            $this->setup_user($previoususerid ?: null);
        }

        return $result;
    }

    /**
     * Switch the global user context for AI request quota attribution.
     *
     * If $userid is null, restore the default user context.
     * If $userid is the same as the current user, do nothing.
     *
     * @param int|null $userid The user ID to switch to, null to restore default.
     * @return int The previous user ID before switching (0 if no user was set).
     */
    private function setup_user(?int $userid): int {
        global $USER;

        $previoususerid = (int) $USER->id;

        // Only switch when necessary.
        if ($userid !== null && (int) $USER->id === $userid) {
            return $previoususerid;
        }

        if (empty($userid)) {
            \core\cron::setup_user();
            return $previoususerid;
        }

        $user = \core_user::get_user($userid);
        if ($user) {
            \core\cron::setup_user($user);
        }

        return $previoususerid;
    }

    /**
     * Get cached extracted content for a file by its content hash.
     *
     * @param string $contenthash The SHA1 content hash of the file.
     * @return string|null The cached content, or null if not found.
     */
    private function get_from_cache(string $contenthash): ?string {
        global $DB;

        $record = $DB->get_record('local_ai_content_cache', ['contenthash' => $contenthash]);
        if (!$record) {
            return null;
        }

        // Update last accessed time and hit counter.
        $clock = \core\di::get(\core\clock::class);
        $record->timelastaccessed = $clock->now()->getTimestamp();
        $record->cachehit++;
        $DB->update_record('local_ai_content_cache', $record);

        return $record->extractedcontent;
    }

    /**
     * Store extracted content in the cache indexed by content hash.
     *
     * @param string $contenthash The SHA1 content hash of the file.
     * @param string $extractedcontent The extracted text content.
     */
    private function store_to_cache(string $contenthash, string $extractedcontent): void {
        global $DB;

        $clock = \core\di::get(\core\clock::class);
        $now = $clock->now()->getTimestamp();

        $existing = $DB->get_record('local_ai_content_cache', ['contenthash' => $contenthash]);
        if ($existing) {
            $existing->extractedcontent = $extractedcontent;
            $existing->timemodified = $now;
            $existing->timelastaccessed = $now;
            $DB->update_record('local_ai_content_cache', $existing);
            return;
        }

        $record = new \stdClass();
        $record->contenthash = $contenthash;
        $record->extractedcontent = $extractedcontent;
        $record->timecreated = $now;
        $record->timemodified = $now;
        $record->timelastaccessed = $now;
        $DB->insert_record('local_ai_content_cache', $record);
    }
}

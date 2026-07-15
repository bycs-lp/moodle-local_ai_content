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

namespace local_ai_content\backend;

/**
 * Interface for AI backend implementations used by the text extraction service.
 *
 * Each AI backend (e.g. local_ai_manager, core_ai subsystem) implements this
 * interface to provide ITT (image-to-text) capabilities and MIME type support
 * information. The extractor resolves the active backend via DI and delegates
 * all AI-related operations through this interface.
 *
 * @package    local_ai_content
 * @copyright  ISB Bayern, 2026
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
interface ai_backend {
    /**
     * Check if the ITT (image-to-text) purpose is available on this backend.
     *
     * This is a lightweight infrastructure check: "Is the backend installed and
     * configured so that ITT requests can potentially be made?" It does NOT
     * check context-specific availability such as user quota or course restrictions.
     *
     * @return bool True if ITT requests can potentially be made.
     */
    public function is_itt_available(): bool;

    /**
     * Check if the backend's connector can process a given MIME type natively.
     *
     * "Natively" means the connector accepts this MIME type directly without
     * any pre-processing (e.g. Gemini accepts application/pdf natively).
     * Standard ITT input types (images) are NOT considered "native" here —
     * they are the baseline capability of any ITT connector.
     *
     * Use this to decide whether to send a file directly to the AI backend
     * or to pre-process it first (e.g. render PDF pages as images).
     *
     * @param string $mimetype The MIME type to check.
     * @return bool True if the connector can handle this MIME type natively.
     */
    public function is_mimetype_natively_supported(string $mimetype): bool;

    /**
     * Get all MIME types natively supported by the backend's connector.
     *
     * Returns the additional MIME types declared by the connector beyond the
     * standard ITT image input types (e.g. application/pdf for Gemini).
     *
     * @return string[] Array of MIME types.
     */
    public function get_natively_supported_mimetypes(): array;

    /**
     * Perform a request to extract text from encoded data.
     *
     * @param string $prompt The prompt instructing the AI what to extract.
     * @param string $encodeddata Base64-encoded data URL of the image or document.
     * @param int $contextid The context ID for the AI request.
     * @return string The extracted text from the AI response.
     * @throws \moodle_exception If the request fails or the backend is not available.
     */
    public function extract_text_from_encoded_data(string $prompt, string $encodeddata, int $contextid): string;

    /**
     * Check if the AI backend is available for ITT in the current user/context.
     *
     * Unlike is_itt_available(), this checks context-specific conditions such as
     * user quota, course restrictions, or block_ai_control settings.
     *
     * @param int $contextid The context ID to check availability for.
     * @return string|null Error message if unavailable, null if available.
     */
    public function get_unavailability_reason(int $contextid): ?string;
}

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
 * AI backend implementation using Moodle's core AI subsystem (4.5+).
 *
 * Delegates text generation requests to core_ai. Note that the core AI
 * subsystem currently only supports generate_text actions, not ITT
 * (image-to-text). Image-based extraction is therefore not available
 * with this backend — only text-based prompts work.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class core_ai_backend implements ai_backend {
    /**
     * Check if ITT is available via the core AI subsystem.
     *
     * The core AI subsystem does not currently support ITT (image-to-text).
     * It only provides generate_text actions. Therefore, ITT-dependent
     * extraction (images, PDFs via page rendering) will not work.
     *
     * @return bool Always false — core AI does not support ITT.
     */
    public function is_itt_available(): bool {
        // Core AI subsystem does not support image-to-text (ITT).
        // Only generate_text is available.
        return false;
    }

    /**
     * Check if a MIME type is natively supported.
     *
     * Since core AI does not support ITT, no MIME types are natively supported
     * for image/document processing.
     *
     * @param string $mimetype The MIME type to check.
     * @return bool Always false.
     */
    public function is_mimetype_natively_supported(string $mimetype): bool {
        return false;
    }

    /**
     * Get natively supported MIME types.
     *
     * @return string[] Always empty — core AI has no native MIME type support for ITT.
     */
    public function get_natively_supported_mimetypes(): array {
        return [];
    }

    /**
     * Perform an image/document text extraction request.
     *
     * The core AI subsystem only supports plain text generation (generate_text)
     * and has no image-to-text (ITT) capability. Attempting to extract text from
     * encoded image or document data is therefore not supported and always fails
     * fast instead of silently returning a prompt-only text response.
     *
     * @param string $prompt The prompt text.
     * @param string $encodeddata Base64-encoded data URL of the image or document.
     * @param int $contextid The context ID for the AI request.
     * @return string Never returns normally.
     * @throws \moodle_exception Always, because core AI does not support ITT.
     */
    public function extract_text_from_encoded_data(string $prompt, string $encodeddata, int $contextid): string {
        // The core AI subsystem cannot process image/document input (no ITT action).
        // Fail fast rather than returning a misleading text-only response.
        throw new \moodle_exception('error_ittnotsupported', 'local_ai_content');
    }

    /**
     * Check if core AI is available for text generation.
     *
     * @param int $contextid The context ID to check availability for.
     * @return string|null Error message if unavailable, null if available.
     */
    public function get_unavailability_reason(int $contextid): ?string {
        if (!class_exists(\core_ai\manager::class)) {
            return get_string('error_ainotavailable', 'local_ai_content');
        }

        $manager = \core\di::get(\core_ai\manager::class);
        if (!$manager->is_action_available(\core_ai\aiactions\generate_text::class)) {
            return get_string('error_ainotavailable', 'local_ai_content');
        }

        return null;
    }
}

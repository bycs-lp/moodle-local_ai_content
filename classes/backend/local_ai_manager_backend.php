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
 * AI backend implementation using local_ai_manager.
 *
 * Delegates ITT (image-to-text) requests to the local_ai_manager plugin
 * which manages AI connectors (e.g. Gemini, OpenAI) and provides
 * purpose-based AI request routing, quota management and access control.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class local_ai_manager_backend implements ai_backend {
    /**
     * Check if the ITT purpose is available via local_ai_manager.
     *
     * Verifies that the local_ai_manager plugin is installed by checking
     * for the existence of its manager class. This does NOT verify that
     * a connector is configured for the ITT purpose — that is a runtime
     * concern handled by get_unavailability_reason().
     *
     * @return bool True if local_ai_manager is installed.
     */
    public function is_itt_available(): bool {
        return class_exists(\local_ai_manager\manager::class);
    }

    /**
     * Check if the local_ai_manager ITT connector supports a MIME type natively.
     *
     * Queries the ITT connector's declared allowedmimetypes list. This includes
     * types like application/pdf for connectors that can process PDFs directly
     * (e.g. Gemini), but excludes standard image types which are the baseline
     * ITT input.
     *
     * @param string $mimetype The MIME type to check.
     * @return bool True if the connector declares native support for this type.
     */
    public function is_mimetype_natively_supported(string $mimetype): bool {
        $mimetypes = $this->get_natively_supported_mimetypes();
        return in_array($mimetype, $mimetypes);
    }

    /**
     * Get all MIME types natively supported by the ITT connector.
     *
     * Returns an empty array if the local_ai_manager plugin is not installed
     * or no ITT connector is configured.
     *
     * @return string[] Array of MIME types from the connector's allowedmimetypes.
     */
    public function get_natively_supported_mimetypes(): array {
        if (!class_exists(\local_ai_manager\ai_manager_utils::class)) {
            return [];
        }

        try {
            $purposeoptions = \local_ai_manager\ai_manager_utils::get_available_purpose_options('itt');
        } catch (\Throwable $e) {
            // No ITT connector configured or purpose unavailable.
            return [];
        }

        if (!empty($purposeoptions['allowedmimetypes']) && is_array($purposeoptions['allowedmimetypes'])) {
            return $purposeoptions['allowedmimetypes'];
        }

        return [];
    }

    /**
     * Perform an ITT request via local_ai_manager.
     *
     * Creates a local_ai_manager\manager instance for the 'itt' purpose
     * and sends the encoded data along with the prompt. The response is
     * validated and the extracted text content is returned.
     *
     * @param string $prompt The prompt instructing the AI what to extract.
     * @param string $encodeddata Base64-encoded data URL of the image or document.
     * @param int $contextid The context ID for the AI request.
     * @return string The extracted text from the AI response.
     * @throws \moodle_exception If local_ai_manager is not available or the request fails.
     */
    public function extract_text_from_encoded_data(string $prompt, string $encodeddata, int $contextid): string {
        if (!class_exists(\local_ai_manager\manager::class)) {
            throw new \moodle_exception('error_ainotavailable', 'local_ai_content');
        }

        $manager = new \local_ai_manager\manager('itt');
        $options = ['image' => $encodeddata];
        $llmresponse = $manager->perform_request($prompt, 'local_ai_content', $contextid, $options);

        if ($llmresponse->get_code() !== 200) {
            throw new \moodle_exception(
                'error_airequestfailed',
                'local_ai_content',
                '',
                $llmresponse->get_errormessage(),
                $llmresponse->get_debuginfo()
            );
        }

        return $llmresponse->get_content();
    }

    /**
     * Check ITT availability for the current user and context via local_ai_manager.
     *
     * Uses local_ai_manager's get_ai_config() to check user-specific availability
     * including quota, course restrictions, and block_ai_control settings.
     *
     * @param int $contextid The context ID to check availability for.
     * @return string|null Error message if unavailable, null if available.
     */
    public function get_unavailability_reason(int $contextid): ?string {
        if (!class_exists(\local_ai_manager\ai_manager_utils::class)) {
            return get_string('error_ainotavailable', 'local_ai_content');
        }

        global $USER;
        $aiconfig = \local_ai_manager\ai_manager_utils::get_ai_config($USER, $contextid, null, ['itt']);

        if (
            empty($aiconfig['availability'])
            || $aiconfig['availability']['available'] !== \local_ai_manager\ai_manager_utils::AVAILABILITY_AVAILABLE
        ) {
            return $aiconfig['availability']['errormessage'] ?: get_string('error_ainotavailable', 'local_ai_content');
        }

        // Check specific ITT purpose availability.
        foreach ($aiconfig['purposes'] as $purposeconfig) {
            if ($purposeconfig['purpose'] === 'itt') {
                if ($purposeconfig['available'] === \local_ai_manager\ai_manager_utils::AVAILABILITY_AVAILABLE) {
                    return null;
                }
                return $purposeconfig['errormessage'] ?: get_string('error_ainotavailable', 'local_ai_content');
            }
        }

        return get_string('error_ainotavailable', 'local_ai_content');
    }
}

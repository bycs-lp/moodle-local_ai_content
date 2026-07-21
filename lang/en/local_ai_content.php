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

/**
 * Lang strings for local_ai_content - EN.
 *
 * @package    local_ai_content
 * @copyright  2026 MoodleDach
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['ai_content:useextraction'] = 'Use the AI text extraction service via UI';
$string['aicontent'] = 'AI Content';
$string['backend'] = 'AI backend';
$string['backend_core_ai_subsystem'] = 'Moodle Core AI Subsystem';
$string['backend_desc'] = 'Select the AI backend to use for text extraction from images and documents.';
$string['backend_local_ai_manager'] = 'Local AI Manager';
$string['cachettl'] = 'Cache lifetime (days)';
$string['cachettl_desc'] = 'Number of days to keep extracted text in the cache before cleanup. Set to 0 to disable caching.';
$string['cannottestextraction'] = 'You do not have permission to use the text extraction test.';
$string['extractionprompt'] = 'Extraction prompt';
$string['extractionprompt_desc'] = 'The prompt sent to the AI backend when extracting text from images or documents. The AI receives this instruction together with the encoded file content.';
$string['extractionprompt_default'] = 'Return the text that is written on the image/document. Do not wrap any explanatory text around. Return only the bare content. If the image/document contains graphics, charts or embedded images, add a precise description of them and document in the extracted text in a clear way that this is an image/graphics/chart description.';
$string['error_ainotavailable'] = 'AI text extraction service is currently not available.';
$string['error_airequestfailed'] = 'AI text extraction request failed: {$a}';
$string['error_cannottestextraction'] = 'You do not have the required capability to test text extraction.';
$string['error_conversionfailed'] = 'Document conversion to text failed: {$a}';
$string['error_ittnotsupported'] = 'The configured AI backend does not support image-to-text extraction.';
$string['error_pdfrenderingunavailable'] = 'PDF page rendering is unavailable because the pdftoppm binary is not configured or not executable.';
$string['error_unsupportedfiletype'] = 'File type not supported for text extraction: {$a}';
$string['filename'] = 'File name';
$string['pluginname'] = 'AI Content Manager';
$string['privacy:metadata:local_ai_content_usage'] = 'Records of text extraction service usage for audit and GDPR compliance.';
$string['privacy:metadata:local_ai_content_usage:cachehit'] = 'Whether the extraction result was served from the cache.';
$string['privacy:metadata:local_ai_content_usage:component'] = 'Plugin that requested the extraction.';
$string['privacy:metadata:local_ai_content_usage:contenthash'] = 'Content hash of the processed file.';
$string['privacy:metadata:local_ai_content_usage:contextid'] = 'Context in which the extraction was performed.';
$string['privacy:metadata:local_ai_content_usage:filename'] = 'Name of the processed file.';
$string['privacy:metadata:local_ai_content_usage:timecreated'] = 'Time when the extraction was performed.';
$string['privacy:metadata:local_ai_content_usage:userid'] = 'The user who triggered the text extraction.';
$string['task_cleanupcache'] = 'Clean up expired text extraction cache entries';
$string['test_extraction'] = 'Test text extraction';
$string['test_extraction_contenthash'] = 'Content hash';
$string['test_extraction_desc'] = 'Upload a file to test whether the text extraction works correctly with the configured AI backend.';
$string['test_extraction_duration'] = 'Extraction time';
$string['test_extraction_file'] = 'File to extract';
$string['test_extraction_fileinfo'] = 'File information';
$string['test_extraction_filesize'] = 'File size';
$string['test_extraction_log'] = 'Processing log';
$string['test_extraction_mimetype'] = 'MIME type';
$string['test_extraction_nofile'] = 'No file was uploaded.';
$string['test_extraction_property'] = 'Property';
$string['test_extraction_result'] = 'Extracted text';
$string['test_extraction_submit'] = 'Extract text';
$string['test_extraction_supported'] = 'Supported';
$string['test_extraction_supportedext'] = 'Supported extensions';
$string['test_extraction_upload'] = 'Upload file';
$string['test_extraction_value'] = 'Value';

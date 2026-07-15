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
$string['error_ainotavailable'] = 'AI text extraction service is currently not available.';
$string['error_airequestfailed'] = 'AI text extraction request failed: {$a}';
$string['error_cannottestextraction'] = 'You do not have the required capability to test text extraction.';
$string['error_unsupportedfiletype'] = 'File type not supported for text extraction: {$a}';
$string['filename'] = 'File name';
$string['pluginname'] = 'AI Content Manager';
$string['privacy:metadata:local_ai_content_usage'] = 'Records of text extraction service usage for audit and GDPR compliance.';
$string['privacy:metadata:local_ai_content_usage:component'] = 'Plugin that requested the extraction.';
$string['privacy:metadata:local_ai_content_usage:contenthash'] = 'Content hash of the processed file.';
$string['privacy:metadata:local_ai_content_usage:filename'] = 'Name of the processed file.';
$string['privacy:metadata:local_ai_content_usage:timecreated'] = 'Time when the extraction was performed.';
$string['privacy:metadata:local_ai_content_usage:userid'] = 'The user who triggered the text extraction.';
$string['task_cleanupcache'] = 'Clean up expired text extraction cache entries';
$string['testextraction'] = 'Test text extraction';
$string['testextraction_contenthash'] = 'Content hash';
$string['testextraction_desc'] = 'Upload a file to test whether the text extraction works correctly with the configured AI backend.';
$string['testextraction_duration'] = 'Extraction time';
$string['testextraction_file'] = 'File to extract';
$string['testextraction_fileinfo'] = 'File information';
$string['testextraction_filesize'] = 'File size';
$string['testextraction_log'] = 'Processing log';
$string['testextraction_mimetype'] = 'MIME type';
$string['testextraction_nofile'] = 'No file was uploaded.';
$string['testextraction_property'] = 'Property';
$string['testextraction_result'] = 'Extracted text';
$string['testextraction_submit'] = 'Extract text';
$string['testextraction_supported'] = 'Supported';
$string['testextraction_supportedext'] = 'Supported extensions';
$string['testextraction_upload'] = 'Upload file';
$string['testextraction_value'] = 'Value';

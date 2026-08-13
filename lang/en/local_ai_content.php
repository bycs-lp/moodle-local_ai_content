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
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['ai_content:managesources'] = 'Manage and index AI content sources';
$string['ai_content:testextraction'] = 'Test the AI text extraction service via admin UI';
$string['ai_content:usesource'] = 'Use AI content sources for retrieval';
$string['aicontent'] = 'AI Content';
$string['allowindexing'] = "Allow Indexing";
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
$string['error_conversionfailed'] = 'Document conversion to text failed: {$a}';
$string['error_ittnotsupported'] = 'The configured AI backend does not support image-to-text extraction.';
$string['error_pdfrenderingunavailable'] = 'PDF page rendering is unavailable because the pdftoppm binary is not configured or not executable.';
$string['error_unsupportedfiletype'] = 'File type not supported for text extraction: {$a}';
$string['extractionprompt'] = 'Extraction prompt';
$string['extractionprompt_default'] = 'Return the text that is written on the image/document. Do not wrap any explanatory text around. Return only the bare content. If the image/document contains graphics, charts or embedded images, add a precise description of them and document in the extracted text in a clear way that this is an image/graphics/chart description.';
$string['extractionprompt_desc'] = 'The prompt sent to the AI backend when extracting text from images or documents. The AI receives this instruction together with the encoded file content.';
$string['filename'] = 'File name';
$string['managesourcespage'] = 'Manage AI sources';
$string['pluginname'] = 'AI Content Manager';
$string['privacy:metadata'] = 'The AI Content Manager plugin does not store any personal user data.';
$string['sourceselection'] = 'Context source selection';
$string['sourceselection_help'] = 'Select which sources should be used for this context when generating AI content.

These sources may be scanned and provide additional context to the user prompt.';
$string['sourceselectiontitle'] = 'Select sources for this context';
$string['sourceselectiondesc'] = 'Choose which sources are selected for this context.';
$string['ragsourcesheading'] = 'Selected sources for this context:';
$string['indexingstatus_idle'] = 'Not indexed';
$string['indexingstatus_queued'] = 'Queued';
$string['indexingstatus_running'] = 'Indexing in progress';
$string['indexingstatus_indexed'] = 'Indexed';
$string['indexingstatus_failed'] = 'Indexing failed';
$string['indexingerror_invalidsource'] = 'Cannot start indexing because the source id is invalid.';
$string['indexingerror_missingrecord'] = 'Cannot start indexing because the source record does not exist anymore.';
$string['section'] = 'Section {$a}';
$string['selectall'] = 'Select all';
$string['selectnone'] = 'Select none';
$string['showemptysections'] = 'Show empty sections';
$string['showemptysections_desc'] = 'When enabled, sections with no selectable sources will be displayed in the context source selector. When disabled, only sections with selectable sources are shown.';
$string['subsection'] = 'Sub-section {$a}';
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

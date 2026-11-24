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
$string['ai_content:selectsources'] = 'Select the AI content sources used in a context';
$string['ai_content:testextraction'] = 'Test the AI text extraction service via admin UI';
$string['ai_content:useglobalsources'] = 'Use global AI content sources for retrieval';
$string['ai_content:usesource'] = 'Use AI content sources for retrieval';
$string['aicontent'] = 'AI Content';
$string['allowindexing'] = "Allow Indexing";
$string['backend'] = 'AI backend';
$string['backend_core_ai_subsystem'] = 'Moodle Core AI Subsystem';
$string['backend_desc'] = 'Select the AI backend to use for text extraction from images and documents.';
$string['backend_local_ai_manager'] = 'Local AI Manager';
$string['bulk_index'] = 'Make searchable or update';
$string['bulk_selectedcount'] = '{$a} selected';
$string['bulk_share'] = 'Share with AI';
$string['bulk_stopsharing'] = 'Stop sharing with AI';
$string['cachettl'] = 'Cache lifetime (days)';
$string['cachettl_desc'] = 'Number of days to keep extracted text in the cache before cleanup. Set to 0 to disable caching.';
$string['cannottestextraction'] = 'You do not have permission to use the text extraction test.';
$string['embeddingbatchsize'] = 'Chunks per embedding request';
$string['embeddingbatchsize_desc'] = 'Number of text chunks of a source sent to the embedding model in one request when indexing a source. Larger values index large sources faster with fewer requests. The value must not exceed the maximum number of inputs per request of the embedding endpoint (for example 16 for older Azure OpenAI API versions, 32 by default for Hugging Face Text Embeddings Inference). Batches exceeding the token limit of the endpoint are split automatically.';
$string['error_ainotavailable'] = 'AI text extraction service is currently not available.';
$string['error_airequestfailed'] = 'AI text extraction request failed: {$a}';
$string['error_cannottestextraction'] = 'You do not have the required capability to test text extraction.';
$string['error_conversionfailed'] = 'Document conversion to text failed: {$a}';
$string['error_deleteembeddingsfailed'] = 'The indexed content could not be removed from the vector store: {$a}';
$string['error_filenotreadable'] = 'The file "{$a}" could not be read.';
$string['error_ittnotsupported'] = 'The configured AI backend does not support image-to-text extraction.';
$string['error_modulenotfound'] = 'The activity does not exist anymore.';
$string['error_modulenotshared'] = 'The content of this activity has not been shared with AI.';
$string['error_modulenotsupported'] = 'The content of this activity cannot be read, because its type or file type is not supported.';
$string['error_noembeddingmodel'] = 'The source cannot be indexed, because there is no AI tool with an embedding model configured for you. Please contact your tenant manager.';
$string['error_novecstore'] = 'There is no vector store available to index this source.';
$string['error_pdfrenderingunavailable'] = 'PDF page rendering is unavailable because the pdftoppm binary is not configured or not executable.';
$string['error_ragembeddingfailed'] = 'The selected sources could not be searched, because the request to the embedding model failed: {$a}';
$string['error_ragembeddinginvalid'] = 'The selected sources could not be searched, because the embedding model returned an invalid result. Please contact your tenant manager.';
$string['error_ragqueryfailed'] = 'The selected sources could not be searched, because the request to the vector database failed. Please contact your tenant manager.';
$string['error_storeembeddingsfailed'] = 'The indexed content could not be stored in the vector store: {$a}';
$string['error_unsupportedfiletype'] = 'File type not supported for text extraction: {$a}';
$string['extractionprompt'] = 'Extraction prompt';
$string['extractionprompt_default'] = 'Return the text that is written on the image/document. Do not wrap any explanatory text around. Return only the bare content. If the image/document contains graphics, charts or embedded images, add a precise description of them and document in the extracted text in a clear way that this is an image/graphics/chart description.';
$string['extractionprompt_desc'] = 'The prompt sent to the AI backend when extracting text from images or documents. The AI receives this instruction together with the encoded file content.';
$string['filename'] = 'File name';
$string['fullcontenttotalwarnchars'] = 'Warning length of all complete contents';
$string['fullcontenttotalwarnchars_desc'] = 'Number of characters above which the source selection warns that the sources whose complete content is added to every AI request are too long in total. Long contents make requests slower and more expensive, and the AI may overlook details. 0 disables the warning.';
$string['fullcontentwarnchars'] = 'Warning length of a complete content';
$string['fullcontentwarnchars_desc'] = 'Number of characters above which the source selection warns that a source is too long to add its complete content to every AI request (about 3000 characters correspond to one page). 0 disables the warning.';
$string['managesourcespage'] = 'Manage AI sources';
$string['pluginname'] = 'AI Content Manager';
$string['privacy:metadata:cache'] = 'Text extracted from files processed by AI features is cached by the content hash of the file. The cache contains no reference to a user and is removed when no file with this content remains or when the cache lifetime expires. If the cache lifetime is 0, nothing is cached.';
$string['privacy:metadata:cache:contenthash'] = 'The SHA1 content hash of the file the text was extracted from.';
$string['privacy:metadata:cache:extractedcontent'] = 'The full text extracted from the file, which may contain personal data.';
$string['privacy:metadata:cache:timecreated'] = 'The time the cache entry was created.';
$string['ragmaxretrievedchars'] = 'Maximum length of retrieved content';
$string['ragmaxretrievedchars_desc'] = 'Default maximum number of characters of the source excerpts added to an AI request. The most relevant excerpts are added until this length is reached. Only the text of the excerpts retrieved from the selected sources counts, not the whole prompt (user prompt, conversation history and instructions come on top). Larger values give the AI more context, but make requests more expensive and slower. Plugins can override this value per request (request option "maxretrievedchars").';
$string['ragminsimilarity'] = 'Minimum similarity of retrieved content';
$string['ragminsimilarity_desc'] = 'Default minimum cosine similarity (between -1 and 1) a source excerpt must have to the user prompt to be added to an AI request. Typical values depend on the embedding model; 0 disables the filter. Plugins can override this value per request (request option "minsimilarity").';
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
$string['indexingstatus_outdated'] = 'Content changed, re-indexing required';
$string['indexingerror_embeddingrequestfailed'] = 'Indexing failed because an embedding request failed: {$a}';
$string['indexingerror_modelchanged'] = 'Indexing failed because the embedding model "{$a}" is not configured for the user who started the indexing anymore.';
$string['indexingerror_nocontent'] = 'Indexing failed because no content could be extracted from the source.';
$string['indexingerror_notsupported'] = 'Indexing failed because the content of this source type is not supported.';
$string['indexingnotavailable_novecstore'] = 'Content you share can be used by AI features. However, it cannot be made searchable at the moment, because no storage location for searchable content has been set up for your tenant yet. Content that is already searchable can still be searched. If you need this, please contact the person who manages the AI tools of your tenant.';
$string['indexwithmymodel'] = 'Index with my embedding model ({$a})';
$string['makesearchable'] = 'Make searchable';
$string['manager_actionerror'] = 'The action could not be performed: {$a}';
$string['manager_activitieshint'] = 'Only activities of the types supported for AI are listed.';
$string['manager_column_activity'] = 'Activity';
$string['manager_column_document'] = 'Document';
$string['manager_column_lastindexed'] = 'Last indexed';
$string['manager_column_shared'] = 'Shared with AI';
$string['manager_coursedocumentshint'] = 'Texts written directly for AI features, available in this course only.';
$string['manager_createdocument'] = 'Create document';
$string['manager_deletedocument'] = 'Delete document';
$string['manager_deletedocument_confirm'] = 'Do you really want to delete the document "{$a}"? It can no longer be used by AI features afterwards.';
$string['manager_deletesource'] = 'Delete "{$a}"';
$string['manager_editdocument'] = 'Edit document';
$string['manager_editsource'] = 'Edit "{$a}"';
$string['manager_globaldocumentshint'] = 'Texts written directly for AI features, available in all courses.';
$string['manager_indexerror'] = 'The indexing could not be started: {$a}';
$string['manager_loaderror'] = 'The sources could not be loaded: {$a}';
$string['manager_noactivities'] = 'This course has no activities of a supported type.';
$string['manager_sharesource'] = 'Share "{$a}" with AI';
$string['searchnotavailable'] = 'Content you share can be used by AI features. However, searching in shared content is currently not available to you. This means, for example, that the AI chat cannot look up matching passages in it by itself. If you need this, please contact the person who manages the AI tools at your institution.';
$string['section'] = 'Section {$a}';
$string['selectall'] = 'Select all';
$string['selectedsourcesoutdated'] = 'At least one selected source has changed since it was indexed. Answers may be based on outdated content.';
$string['selector_addsource'] = 'Add sources from another course';
$string['selector_changecourse'] = 'Change course';
$string['selector_choosecourse'] = 'Add sources from another course';
$string['selector_course'] = 'Course';
$string['selector_coursedocuments'] = 'Course documents';
$string['selector_courseactivities'] = 'Activities of this course';
$string['selector_externalsources'] = 'Sources from other courses';
$string['selector_fullwarning'] = 'Very long: the AI may overlook details and answers get slower. "Look up" is usually the better choice.';
$string['selector_globaldocuments'] = 'Global documents';
$string['selector_help_heading'] = 'Read fully or look up – what is the difference?';
$string['selector_help_tip'] = 'If you are unsure: use "Look up". It works for short and long content.';
$string['selector_importtitle'] = 'Add sources from "{$a}"';
$string['selector_intro'] = 'Choose which content the AI may use to answer. For every selected source you can decide how the AI uses it.';
$string['selector_launcher'] = 'Select the sources of the AI';
$string['selector_loadcourseserror'] = 'The courses could not be loaded.';
$string['selector_loaderror'] = 'The sources could not be loaded.';
$string['selector_loadimportsourceserror'] = 'The sources of the selected course could not be loaded.';
$string['selector_loading'] = 'Loading sources …';
$string['selector_loadsources'] = 'Show sources';
$string['selector_mode'] = 'How should the AI use "{$a}"?';
$string['selector_mode_full'] = 'Read fully';
$string['selector_mode_full_help'] = 'The AI receives the complete content with every question. Best for short texts such as tasks, instructions or rules: nothing is overlooked. With long texts answers get slower and the AI may overlook details.';
$string['selector_mode_full_unavailable'] = 'This source cannot be read fully, because its content is only available for looking up.';
$string['selector_mode_search'] = 'Look up';
$string['selector_mode_search_help'] = 'For every question the AI looks up the passages matching it and only reads these. Best for long texts such as scripts or curricula: answers stay fast, but the AI only sees parts of the content.';
$string['selector_mode_search_unavailable'] = 'This source cannot be looked up yet, because it has not been made searchable in the source management.';
$string['selector_nocourseactivities'] = 'No activities of this course have been shared with AI yet.';
$string['selector_nocoursedocuments'] = 'No course documents available.';
$string['selector_nocourses'] = 'No other courses with usable sources found.';
$string['selector_noexternalsources'] = 'No sources from other courses added.';
$string['selector_noglobaldocuments'] = 'No global documents available.';
$string['selector_readonly'] = 'Only teachers of the course can change the selection.';
$string['selector_removesource'] = 'Remove source "{$a}"';
$string['selector_saved'] = 'Saved';
$string['selector_saveerror'] = 'The selection could not be saved.';
$string['selector_saving'] = 'Saving …';
$string['selector_selectedcount'] = '{$a->selected} of {$a->total} selected';
$string['selector_selectgroup'] = 'Select all sources of "{$a}"';
$string['selector_size_lessthanpage'] = 'less than 1 page';
$string['selector_size_page'] = 'about 1 page';
$string['selector_size_pages'] = 'about {$a} pages';
$string['selector_size_unknown'] = 'Size unknown';
$string['selector_size_unknown_help'] = 'The size is known as soon as the content has been read once, for example when it is made searchable or used by the AI for the first time.';
$string['selector_toggle'] = 'Show or hide the sources of "{$a}"';
$string['selector_totalwarning'] = 'The sources read fully are very long in total ({$a}). Answers get slower and the AI may overlook details. Switch long sources to "Look up".';
$string['selectsource'] = 'Select "{$a}"';
$string['sharednotsearchable'] = 'Shared, not searchable';
$string['sharednotsearchable_desc'] = 'AI features can use this content, but it will not be found when searching.';
$string['sourceoutdated'] = 'Outdated';
$string['sourceoutdated_desc'] = 'The content has changed since it was indexed. Until the source is re-indexed, answers are based on the old content.';
$string['sourcetype_document'] = 'Document';
$string['sourcetype_external'] = 'External source';
$string['subsection'] = 'Sub-section {$a}';
$string['task_cleanupcache'] = 'Clean up expired text extraction cache entries';
$string['task_cleanupsourceselections'] = 'Clean up source selections of deleted contexts';
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
$string['vecstoreusage_externalsources'] = '{$a} external sources reference this vector database. They will be disabled.';
$string['vecstoreusage_sources'] = '{$a} activities and documents are indexed in this vector database. They will be reset to "not indexed".';

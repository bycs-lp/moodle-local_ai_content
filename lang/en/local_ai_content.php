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
 * @author     
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['aicontent'] = 'AI Content';
$string['allowindexing'] = "Allow Indexing
";
$string['ai_content:managesources'] = 'Manage and index AI content sources';
$string['ai_content:usesource'] = 'Use AI content sources for retrieval';
$string['pluginname'] = 'AI Content Manager';
$string['ragcontent'] = 'Grounding Context';
$string['ragcontent_help'] = 'Select the activities you want to use to ground the AI generated content.

These sources may be scanned and provide additional context to the user prompt.';

// RAG Contexts form element strings.
$string['ragcontexts'] = 'Select Activities';
$string['ragcontextsdesc'] = 'Select the activities you want to include in the RAG context.';
$string['ragsourcesheading'] = 'Sources:';
$string['section'] = 'Section {$a}';
$string['selectall'] = 'Select all';
$string['selectnone'] = 'Select none';
$string['subsection'] = 'Sub-section {$a}';

// Plugin settings.
$string['showemptysections'] = 'Show empty sections';
$string['showemptysections_desc'] = 'When enabled, sections with no activities will be displayed in the RAG contexts selector. When disabled, only sections with activities are shown.';

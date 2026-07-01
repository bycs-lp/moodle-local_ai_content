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

namespace local_ai_content\local\contentprocessor;

/**
 * Class content_page
 * 
 * Fetches the content of a page for indexing.
 *
 * @package    local_ai_content
 * @copyright  2026 YOUR NAME <your@email.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class content_page {
    protected $cm;
    protected $instance;
    protected $page;
    protected $context;

    /**
     * @var \cm_info $cm
     */
    public function __construct($cm) {
        global $DB;
        $this->cm = $cm;
        $this->context = \context_module::instance($cm->id);
        $this->page = $DB->get_record('page',
        [
            'id' => $cm->instance
        ], '*', MUST_EXIST);
    }

    public function extract() {
        // print_r($this);
        $content = file_rewrite_pluginfile_urls(
            $this->page->content,
            'pluginfile.php',
            $this->context->id,
            'mod_page',
            'content',
            $this->page->revision
        );
        $content = format_text($content, $this->page->contentformat, ['context' => $this->context]);
        return $content;
    }

    public function get_chunks($content) {
        // Split into 80k character chunks, with 100 character overlap.
        $chunk_size = 80000;
        $overlap = 100;
        $chunks = [];
        $start = 0;
        $content_length = strlen($content);
        while ($start < $content_length) {
            $end = min($start + $chunk_size, $content_length);
            $chunk = substr($content, $start, $end - $start);
            $chunks[] = $chunk;
            $start += $chunk_size - $overlap;
        }
        return $chunks;
    }
}

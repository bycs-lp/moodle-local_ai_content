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

namespace local_ai_content\local;
use local_ai_manager\local\connector_factory;
use \modinfo;
use local_ai_content\persistent\contentconfig;
// This is required because course_get_format() is course/lib.php and isn't loaded!
require_once($CFG->dirroot.'/course/lib.php');
/**
 * Class indexer_manager
 *
 * @package    local_ai_content
 * @copyright  2026 YOUR NAME <your@email.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class indexer_manager {
    
    /** @var \context Context */
    protected $context;

    /**
     * @var ai_manager
     */
    protected $ai_manager;

    /**
     * indexer_manager constructor.
     *
     * @param int $contextid
     * @param ai_manager $ai_manager
     */
    function __construct($contextid, $ai_manager) {
        $this->context = \context::instance_by_id($contextid);
        // print_r($this->context);
        if ($this->context->contextlevel !== CONTEXT_COURSE) {
            throw new \coding_exception('Context must be a course context.');
        }
        $this->ai_manager = $ai_manager;
    }

    function index() {
        // 1. Identify all of the course modules with indexall = 1.
        $course = get_course($this->context->instanceid);
        [$rawcms, $cmconfigs] = contentconfig::get_course_module_configs($course);

        // For the moment we'll force index everything, but 
        // later we'll observe the lastindexed timestamp and only index new content.

        foreach($cmconfigs as $cmconfig) {
            $cmid = $cmconfig->get('cmid');
            if (!isset($rawcms[$cmid])) {
                continue;
            }
            $rawcm = $rawcms[$cmid];
            // print_r($rawcm);
            $cm = get_coursemodule_from_id($rawcm->mod, $rawcm->cm, 0, false, MUST_EXIST);
            $processor = $this->get_content_processor($rawcm->mod, $cm);
            if ($processor) {
                $content = $processor->extract();

                print_r($cm);
                $cmcontext = \context_module::instance($cm->id);
                // print_r($content);
                $payload = $this->build_vector_store_payload($cm, $content);

                if (method_exists($processor, 'get_chunks')) {
                    $chunks = $processor->get_chunks($content);
                    $display = clone $payload;
                    // unset($display->vector);
                    // print_r($display);
                    if ($chunks) {
                        // Generate each chunk payload
                        $chunkcount = 1;
                        $maxchunks = count($chunks);
                        $payload->maxchunks = $maxchunks;
                        $enrichedvectors = [];
                        foreach($chunks as $chunk) {
                            $vectorrequest = $this->ai_manager->perform_request($chunk, "local_ai_content", $this->context->id);
                            $vector = $vectorrequest->get_content();
                            $payload->content = $chunk;
                            $payload->vector = $vector;
                            $payload->chunk = $chunkcount;

                            // echo "Payload for chunk $payload->chunk of $payload->maxchunks:\n";
                            $display = clone $payload;
                            $display->vector = 'truncated';
                            // print_r($display);
                            $enrichedvectors[] = enriched_vector::create($payload->vector, $payload->content, $cmcontext->id, $chunkcount, $maxchunks);
                            $chunkcount++;
                        }
                        print_r($enrichedvectors);
                        \core\di::get(connector_factory::class)->get_primary_vecstore()->insert_embeddings($enrichedvectors);
                    }
                } else {
                    $vectorrequest = $this->ai_manager->perform_request($content, "local_ai_content", $this->context->id);
                    $vector = $vectorrequest->get_content();
                    $payload->chunk = 0;
                    $ev = enriched_vector::create($payload->vector, $payload->content, $cmcontext->id, $chunkcount, $maxchunks);
                    print_r($ev);
                    \core\di::get(connector_factory::class)->get_primary_vecstore()->insert_embeddings([$ev]);
                }

            }
        }
    }

    protected function build_vector_store_payload($cm, $content) {
        return (object)[
            'vector' => null,
            'cmid' => $cm->id,
            'modname' => $cm->modname,
            'content' => $content,
            'chunk' => 0,
            'maxchunks' => null,
        ];
    }
    protected function get_content_processor($modname, $cm) {
        // $modname = $rawcm->mod;
        $processname = 'local_ai_content\local\contentprocessor\content_' . $modname;
        if (class_exists($processname)) {
            return new $processname($cm);
        }
        return null;
    }
}

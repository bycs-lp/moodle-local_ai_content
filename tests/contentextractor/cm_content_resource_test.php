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

namespace local_ai_content\contentextractor;

/**
 * Tests for cm_content_resource.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(cm_content_resource::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(\local_ai_content\cm_content_extractor::class)]
final class cm_content_resource_test extends \advanced_testcase {
    /**
     * Test that the content hash changes with the file and the description without extracting the file.
     */
    public function test_get_content_hash(): void {
        global $DB;
        $this->resetAfterTest();
        $this->setAdminUser();
        $extractor = $this->createMock(\local_ai_content\document_extractor::class);
        $extractor->expects($this->never())->method('extract_text_from_file');
        \core\di::set(\local_ai_content\document_extractor::class, $extractor);
        $course = $this->getDataGenerator()->create_course();
        $resource = $this->getDataGenerator()->create_module('resource', ['course' => $course->id]);
        $cm = get_fast_modinfo($course)->get_cm($resource->cmid);
        $contentextractor = new cm_content_resource();

        $hash = $contentextractor->get_content_hash($cm);
        $this->assertSame($hash, $contentextractor->get_content_hash($cm));

        $fs = get_file_storage();
        $fs->delete_area_files($cm->context->id, 'mod_resource', 'content');
        $fs->create_file_from_string([
            'contextid' => $cm->context->id,
            'component' => 'mod_resource',
            'filearea' => 'content',
            'itemid' => 0,
            'filepath' => '/',
            'filename' => 'changed.txt',
        ], 'Changed content');
        $filehash = $contentextractor->get_content_hash($cm);
        $this->assertNotSame($hash, $filehash);

        $DB->set_field('resource', 'intro', 'Changed description', ['id' => $resource->id]);
        rebuild_course_cache($course->id, true);
        $cm = get_fast_modinfo($course)->get_cm($resource->cmid);
        $this->assertNotSame($filehash, $contentextractor->get_content_hash($cm));
    }
}



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
 * Tests for cm_content_folder.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(cm_content_folder::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(\local_ai_content\cm_content_extractor::class)]
final class cm_content_folder_test extends \advanced_testcase {
    /**
     * Test that the content hash changes with the files of the folder without extracting them.
     */
    public function test_get_content_hash(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $extractor = $this->createMock(\local_ai_content\document_extractor::class);
        $extractor->expects($this->never())->method('extract_text_from_file');
        \core\di::set(\local_ai_content\document_extractor::class, $extractor);
        $course = $this->getDataGenerator()->create_course();
        $folder = $this->getDataGenerator()->create_module('folder', ['course' => $course->id]);
        $cm = get_fast_modinfo($course)->get_cm($folder->cmid);
        $fs = get_file_storage();
        $filerecord = [
            'contextid' => $cm->context->id,
            'component' => 'mod_folder',
            'filearea' => 'content',
            'itemid' => 0,
            'filepath' => '/',
        ];
        $fs->create_file_from_string($filerecord + ['filename' => 'first.txt'], 'First file');
        $contentextractor = new cm_content_folder();

        $hash = $contentextractor->get_content_hash($cm);
        $this->assertSame($hash, $contentextractor->get_content_hash($cm));

        $secondfile = $fs->create_file_from_string($filerecord + ['filename' => 'second.txt'], 'Second file');
        $addedhash = $contentextractor->get_content_hash($cm);
        $this->assertNotSame($hash, $addedhash);

        $secondfile->delete();
        $fs->create_file_from_string($filerecord + ['filename' => 'second.txt'], 'Changed second file');
        $this->assertNotSame($addedhash, $contentextractor->get_content_hash($cm));
    }
}



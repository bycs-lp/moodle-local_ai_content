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

namespace local_ai_content;

/**
 * Tests for plugin callbacks in lib.php.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class lib_test extends \advanced_testcase {
    /**
     * Test that cache entries are deleted only after the last file with a content hash is deleted.
     *
     * @covers \local_ai_content_after_file_deleted
     */
    public function test_local_ai_content_after_file_deleted(): void {
        global $DB;

        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);

        $context = \context_user::instance($user->id);
        $fs = get_file_storage();
        $filerecord = [
            'contextid' => $context->id,
            'component' => 'user',
            'filearea' => 'draft',
            'itemid' => file_get_unused_draft_itemid(),
            'filepath' => '/',
        ];

        $content = 'identical content for callback test';

        $filerecord['filename'] = 'first.txt';
        $file1 = $fs->create_file_from_string($filerecord, $content);

        $filerecord['filename'] = 'second.txt';
        $file2 = $fs->create_file_from_string($filerecord, $content);

        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $generator->create_cache_record([
            'contenthash' => $file1->get_contenthash(),
            'extractedcontent' => 'cached text',
        ]);

        $this->assertTrue($DB->record_exists('local_ai_content_cache', ['contenthash' => $file1->get_contenthash()]));

        $file1->delete();
        $this->assertTrue($DB->record_exists('local_ai_content_cache', ['contenthash' => $file1->get_contenthash()]));

        $file2->delete();
        $this->assertFalse($DB->record_exists('local_ai_content_cache', ['contenthash' => $file1->get_contenthash()]));
    }
}

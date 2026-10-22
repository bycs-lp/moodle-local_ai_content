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

namespace local_ai_content\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\writer;
use core_privacy\local\request\userlist;

/**
 * Tests for the privacy provider of local_ai_content.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_ai_content\privacy\provider
 */
final class provider_test extends \core_privacy\tests\provider_testcase {
    /**
     * Test that the component is accepted as privacy compliant by the privacy manager.
     */
    public function test_component_is_compliant(): void {
        $manager = new \core_privacy\manager();
        $this->assertTrue($manager->component_is_compliant('local_ai_content'));
    }

    /**
     * Test that the cache table with the extracted full text is declared.
     */
    public function test_metadata_declares_cache_table(): void {
        $collection = provider::get_metadata(new collection('local_ai_content'));
        $items = $collection->get_collection();
        $this->assertCount(1, $items);

        $table = $items[0];
        $this->assertEquals('local_ai_content_cache', $table->get_name());
        $fields = array_keys($table->get_privacy_fields());
        $this->assertEquals(['contenthash', 'extractedcontent', 'timecreated'], $fields);
    }

    /**
     * Test that the request methods neither find, export nor delete anything, as the cache has no user reference.
     */
    public function test_request_methods_are_noops(): void {
        global $DB;
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $record = $generator->create_cache_record(['extractedcontent' => 'Student essay']);
        $systemcontext = \context_system::instance();

        $contextlist = provider::get_contexts_for_userid($user->id);
        $this->assertCount(0, $contextlist);

        $userlist = new userlist($systemcontext, 'local_ai_content');
        provider::get_users_in_context($userlist);
        $this->assertCount(0, $userlist);

        $approvedcontextlist = new approved_contextlist($user, 'local_ai_content', [$systemcontext->id]);
        provider::export_user_data($approvedcontextlist);
        $this->assertFalse(writer::with_context($systemcontext)->has_any_data());

        provider::delete_data_for_all_users_in_context($systemcontext);
        provider::delete_data_for_user($approvedcontextlist);
        $approveduserlist = new approved_userlist($systemcontext, 'local_ai_content', [$user->id]);
        provider::delete_data_for_users($approveduserlist);

        $this->assertEquals(1, $DB->count_records('local_ai_content_cache'));
        $after = $DB->get_record('local_ai_content_cache', ['id' => $record->id]);
        $this->assertEquals('Student essay', $after->extractedcontent);
    }
}

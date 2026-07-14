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

use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;
use core_privacy\tests\provider_testcase;

/**
 * Tests for the privacy provider.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_ai_content\privacy\provider
 */
final class provider_test extends provider_testcase {
    /**
     * Set up test environment.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
    }

    /**
     * Get the plugin data generator.
     *
     * @return \local_ai_content_generator The data generator instance.
     */
    private function get_generator(): \local_ai_content_generator {
        return $this->getDataGenerator()->get_plugin_generator('local_ai_content');
    }

    /**
     * Test that metadata is returned correctly.
     */
    public function test_get_metadata(): void {
        $collection = new \core_privacy\local\metadata\collection('local_ai_content');
        $collection = provider::get_metadata($collection);
        $items = $collection->get_collection();
        $this->assertNotEmpty($items);

        $table = reset($items);
        $this->assertInstanceOf(\core_privacy\local\metadata\types\database_table::class, $table);
        $this->assertEquals('local_ai_content_usage', $table->get_name());
    }

    /**
     * Test get_contexts_for_userid returns correct contexts.
     */
    public function test_get_contexts_for_userid(): void {
        $user = $this->getDataGenerator()->create_user();
        $context = \context_system::instance();
        $course = $this->getDataGenerator()->create_course();
        $coursecontext = \context_course::instance($course->id);

        $generator = $this->get_generator();
        $generator->create_usage_record(['userid' => $user->id, 'contextid' => $context->id]);
        $generator->create_usage_record(['userid' => $user->id, 'contextid' => $coursecontext->id]);

        $contextlist = provider::get_contexts_for_userid($user->id);
        $contextids = $contextlist->get_contextids();

        $this->assertCount(2, $contextids);
        $this->assertContainsEquals($context->id, $contextids);
        $this->assertContainsEquals($coursecontext->id, $contextids);
    }

    /**
     * Test get_contexts_for_userid does not return other users' contexts.
     */
    public function test_get_contexts_for_userid_isolation(): void {
        $user1 = $this->getDataGenerator()->create_user();
        $user2 = $this->getDataGenerator()->create_user();
        $context = \context_system::instance();

        $generator = $this->get_generator();
        $generator->create_usage_record(['userid' => $user1->id, 'contextid' => $context->id]);
        $generator->create_usage_record(['userid' => $user2->id, 'contextid' => $context->id]);

        $contextlist = provider::get_contexts_for_userid($user1->id);
        $this->assertCount(1, $contextlist->get_contextids());

        $contextlist = provider::get_contexts_for_userid($user2->id);
        $this->assertCount(1, $contextlist->get_contextids());
    }

    /**
     * Test get_users_in_context returns the correct users.
     */
    public function test_get_users_in_context(): void {
        $user1 = $this->getDataGenerator()->create_user();
        $user2 = $this->getDataGenerator()->create_user();
        $context = \context_system::instance();

        $generator = $this->get_generator();
        $generator->create_usage_record(['userid' => $user1->id, 'contextid' => $context->id]);
        $generator->create_usage_record(['userid' => $user2->id, 'contextid' => $context->id]);
        // Null userid should not appear.
        $generator->create_usage_record(['userid' => null, 'contextid' => $context->id]);

        $userlist = new userlist($context, 'local_ai_content');
        provider::get_users_in_context($userlist);

        $userids = $userlist->get_userids();
        $this->assertCount(2, $userids);
        $this->assertContainsEquals($user1->id, $userids);
        $this->assertContainsEquals($user2->id, $userids);
    }

    /**
     * Test export_user_data exports the correct data.
     */
    public function test_export_user_data(): void {
        $user = $this->getDataGenerator()->create_user();
        $context = \context_system::instance();

        $generator = $this->get_generator();
        $generator->create_usage_record([
            'userid' => $user->id,
            'contextid' => $context->id,
            'filename' => 'report.pdf',
            'component' => 'assignfeedback_aif',
            'cachehit' => 0,
            'timecreated' => 1700000000,
        ]);
        $generator->create_usage_record([
            'userid' => $user->id,
            'contextid' => $context->id,
            'filename' => 'image.png',
            'component' => 'mod_quiz',
            'cachehit' => 1,
            'timecreated' => 1700001000,
        ]);

        $contextlist = new approved_contextlist($user, 'local_ai_content', [$context->id]);
        provider::export_user_data($contextlist);

        $data = writer::with_context($context)->get_data([get_string('pluginname', 'local_ai_content')]);
        $this->assertNotEmpty($data);
        $this->assertCount(2, $data->usage);
        $this->assertEquals('report.pdf', $data->usage[0]->filename);
        $this->assertEquals('assignfeedback_aif', $data->usage[0]->component);
        $this->assertEquals('no', $data->usage[0]->cachehit);
        $this->assertEquals('image.png', $data->usage[1]->filename);
        $this->assertEquals('yes', $data->usage[1]->cachehit);
    }

    /**
     * Test delete_data_for_all_users_in_context deletes all records for a context.
     */
    public function test_delete_data_for_all_users_in_context(): void {
        global $DB;

        $user1 = $this->getDataGenerator()->create_user();
        $user2 = $this->getDataGenerator()->create_user();
        $context = \context_system::instance();
        $course = $this->getDataGenerator()->create_course();
        $coursecontext = \context_course::instance($course->id);

        $generator = $this->get_generator();
        $generator->create_usage_record(['userid' => $user1->id, 'contextid' => $context->id]);
        $generator->create_usage_record(['userid' => $user2->id, 'contextid' => $context->id]);
        $generator->create_usage_record(['userid' => $user1->id, 'contextid' => $coursecontext->id]);

        $this->assertEquals(3, $DB->count_records('local_ai_content_usage'));

        provider::delete_data_for_all_users_in_context($context);

        $this->assertEquals(1, $DB->count_records('local_ai_content_usage'));
        $this->assertEquals(1, $DB->count_records('local_ai_content_usage', ['contextid' => $coursecontext->id]));
    }

    /**
     * Test delete_data_for_user deletes only the specified user's data.
     */
    public function test_delete_data_for_user(): void {
        global $DB;

        $user1 = $this->getDataGenerator()->create_user();
        $user2 = $this->getDataGenerator()->create_user();
        $context = \context_system::instance();

        $generator = $this->get_generator();
        $generator->create_usage_record(['userid' => $user1->id, 'contextid' => $context->id]);
        $generator->create_usage_record(['userid' => $user1->id, 'contextid' => $context->id]);
        $generator->create_usage_record(['userid' => $user2->id, 'contextid' => $context->id]);

        $this->assertEquals(3, $DB->count_records('local_ai_content_usage'));

        $contextlist = new approved_contextlist($user1, 'local_ai_content', [$context->id]);
        provider::delete_data_for_user($contextlist);

        $this->assertEquals(1, $DB->count_records('local_ai_content_usage'));
        $this->assertEquals(1, $DB->count_records('local_ai_content_usage', ['userid' => $user2->id]));
    }

    /**
     * Test delete_data_for_users deletes data for multiple users.
     */
    public function test_delete_data_for_users(): void {
        global $DB;

        $user1 = $this->getDataGenerator()->create_user();
        $user2 = $this->getDataGenerator()->create_user();
        $user3 = $this->getDataGenerator()->create_user();
        $context = \context_system::instance();

        $generator = $this->get_generator();
        $generator->create_usage_record(['userid' => $user1->id, 'contextid' => $context->id]);
        $generator->create_usage_record(['userid' => $user2->id, 'contextid' => $context->id]);
        $generator->create_usage_record(['userid' => $user3->id, 'contextid' => $context->id]);

        $this->assertEquals(3, $DB->count_records('local_ai_content_usage'));

        $userlist = new approved_userlist($context, 'local_ai_content', [$user1->id, $user2->id]);
        provider::delete_data_for_users($userlist);

        $this->assertEquals(1, $DB->count_records('local_ai_content_usage'));
        $this->assertEquals(1, $DB->count_records('local_ai_content_usage', ['userid' => $user3->id]));
    }

    /**
     * Test delete_data_for_users with empty userlist does nothing.
     */
    public function test_delete_data_for_users_empty(): void {
        global $DB;

        $user = $this->getDataGenerator()->create_user();
        $context = \context_system::instance();

        $generator = $this->get_generator();
        $generator->create_usage_record(['userid' => $user->id, 'contextid' => $context->id]);

        $userlist = new approved_userlist($context, 'local_ai_content', []);
        provider::delete_data_for_users($userlist);

        $this->assertEquals(1, $DB->count_records('local_ai_content_usage'));
    }
}

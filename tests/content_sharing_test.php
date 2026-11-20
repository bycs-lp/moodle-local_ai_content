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

use local_ai_content\local\source;

/**
 * Tests for content_sharing.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(content_sharing::class)]
final class content_sharing_test extends \advanced_testcase {
    /**
     * Only course modules with an enabled module source are shared, no matter if they are indexed.
     */
    public function test_is_module_shared(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $coursecontextid = \context_course::instance($course->id)->id;
        $shared = $this->getDataGenerator()->create_module('page', ['course' => $course->id]);
        $notshared = $this->getDataGenerator()->create_module('page', ['course' => $course->id]);
        $withoutsource = $this->getDataGenerator()->create_module('page', ['course' => $course->id]);
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $generator->create_source(['contextid' => $coursecontextid, 'sourcetype' => source::TYPE_MODULE, 'cmid' => $shared->cmid]);
        $generator->create_source([
            'contextid' => $coursecontextid,
            'sourcetype' => source::TYPE_MODULE,
            'cmid' => $notshared->cmid,
            'enabled' => false,
        ]);

        $sharing = \core\di::get(content_sharing::class);

        $this->assertTrue($sharing->is_module_shared($shared->cmid));
        $this->assertFalse($sharing->is_module_shared($notshared->cmid));
        $this->assertFalse($sharing->is_module_shared($withoutsource->cmid));
    }

    /**
     * The content of a shared course module is extracted, the content of a course module not shared is refused.
     */
    public function test_get_module_content(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $coursecontextid = \context_course::instance($course->id)->id;
        $shared = $this->getDataGenerator()->create_module('page', ['course' => $course->id, 'content' => 'Shared content']);
        $notshared = $this->getDataGenerator()->create_module('page', ['course' => $course->id, 'content' => 'Secret']);
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $generator->create_source(['contextid' => $coursecontextid, 'sourcetype' => source::TYPE_MODULE, 'cmid' => $shared->cmid]);

        $sharing = \core\di::get(content_sharing::class);

        $this->assertStringContainsString('Shared content', $sharing->get_module_content($shared->cmid));
        $this->expectException(\moodle_exception::class);
        $this->expectExceptionMessage(get_string('error_modulenotshared', 'local_ai_content'));
        $sharing->get_module_content($notshared->cmid);
    }

    /**
     * Reading a shared course module of a type without content extractor fails with a neutral message.
     */
    public function test_get_module_content_of_unsupported_module(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $forum = $this->getDataGenerator()->create_module('forum', ['course' => $course->id]);
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $generator->create_source([
            'contextid' => \context_course::instance($course->id)->id,
            'sourcetype' => source::TYPE_MODULE,
            'cmid' => $forum->cmid,
        ]);

        $this->expectException(\moodle_exception::class);
        $this->expectExceptionMessage(get_string('error_modulenotsupported', 'local_ai_content'));
        \core\di::get(content_sharing::class)->get_module_content($forum->cmid);
    }
}

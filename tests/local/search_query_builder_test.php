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

use local_ai_content\tests\local\testable_search_query_builder;
use local_ai_manager\hook\additional_user_restriction;

/**
 * Tests for the search_query_builder.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(search_query_builder::class)]
final class search_query_builder_test extends \advanced_testcase {
    /** @var string The query returned by the fake AI request. */
    private const GENERATED_QUERY = 'Assessment criteria in the mathematics curriculum';

    /** @var string The latest message of the user. */
    private const PROMPT = 'What about the second point?';

    /** @var array A conversation with two questions and answers, preceded by a system message. */
    private const CONVERSATION = [
        ['sender' => 'system', 'message' => 'You are a helpful assistant.'],
        ['sender' => 'user', 'message' => 'Hello'],
        ['sender' => 'ai', 'message' => 'Hello, how can I help you?'],
        ['sender' => 'user', 'message' => 'What does the curriculum say about assessment?'],
        ['sender' => 'ai', 'message' => '1. Written exams 2. Oral contributions'],
    ];

    #[\Override]
    protected function setUp(): void {
        parent::setUp();
        // Defined setup independent of other plugins extending the user info or restricting the access.
        $this->redirectHook(\local_ai_manager\hook\userinfo_extend::class, fn() => null);
        $this->redirectHook(\local_ai_manager\hook\custom_tenant::class, fn() => null);
        $this->redirectHook(
            additional_user_restriction::class,
            fn(additional_user_restriction $hook) => $hook->set_access_allowed(true)
        );
    }

    /**
     * Creates a user allowed to use the AI manager, sets it as current user and assigns an AI tool to the purpose
     * 'searchquery' if requested.
     *
     * @param bool $configured Whether an AI tool is assigned to the purpose.
     * @return int The id of the course context of the request.
     */
    private function set_up_user(bool $configured): int {
        /** @var \local_ai_manager_generator $aimanagergenerator */
        $aimanagergenerator = $this->getDataGenerator()->get_plugin_generator('local_ai_manager');
        $user = $this->getDataGenerator()->create_user(['institution' => '1234']);
        $this->setUser($user);
        $aimanagergenerator->enable_ai_usage($user);
        if ($configured) {
            $aimanagergenerator->create_purpose_tool(search_query_builder::PURPOSE);
        }
        return \context_course::instance($this->getDataGenerator()->create_course()->id)->id;
    }

    /**
     * Without a conversation history the prompt is used unchanged and no search query is generated.
     */
    public function test_build_without_history(): void {
        $this->resetAfterTest();
        $contextid = $this->set_up_user(true);
        $builder = new testable_search_query_builder(self::GENERATED_QUERY);

        $conversation = [['sender' => 'system', 'message' => 'You are a helpful assistant.']];
        $this->assertSame(self::PROMPT, $builder->build(self::PROMPT, $conversation, 'block_ai_chat', $contextid));
        $this->assertSame(self::PROMPT, $builder->build(self::PROMPT, [], 'block_ai_chat', $contextid));
        $this->assertNull($builder->requestedhistory);
    }

    /**
     * With an available purpose the generated search query is used, the history is passed without system messages.
     */
    public function test_build_with_available_purpose(): void {
        $this->resetAfterTest();
        $contextid = $this->set_up_user(true);
        $builder = new testable_search_query_builder(self::GENERATED_QUERY);

        $result = $builder->build(self::PROMPT, self::CONVERSATION, 'block_ai_chat', $contextid);

        $this->assertSame(self::GENERATED_QUERY, $result);
        $this->assertSame(array_slice(self::CONVERSATION, 1), $builder->requestedhistory);
    }

    /**
     * A failed search query request or an unusable search query (e.g. too long, discarded by the purpose) falls back to the
     * last user messages.
     */
    public function test_build_with_failed_request(): void {
        $this->resetAfterTest();
        $contextid = $this->set_up_user(true);
        $builder = new testable_search_query_builder('');

        $result = $builder->build(self::PROMPT, self::CONVERSATION, 'block_ai_chat', $contextid);

        $this->assertNotNull($builder->requestedhistory);
        $this->assertSame("What does the curriculum say about assessment?\n\n" . self::PROMPT, $result);
    }

    /**
     * Without an AI tool for the purpose no search query is generated, the last user messages are used instead.
     */
    public function test_build_with_unavailable_purpose(): void {
        $this->resetAfterTest();
        $contextid = $this->set_up_user(false);
        $builder = new testable_search_query_builder(self::GENERATED_QUERY);

        $result = $builder->build(self::PROMPT, self::CONVERSATION, 'block_ai_chat', $contextid);

        $this->assertNull($builder->requestedhistory);
        $this->assertSame("What does the curriculum say about assessment?\n\n" . self::PROMPT, $result);
    }
}

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

use local_ai_manager\ai_manager_utils;
use local_ai_manager\local\requestoptions\conversationcontext;
use local_ai_manager\manager;

/**
 * Builds the text which is embedded for the similarity search of the RAG retrieval.
 *
 * Follow-up messages in a conversation ("And what about the second point?") often do not contain the topic they refer to,
 * so embedding only the latest message finds little. If there is a conversation history, the search text is therefore built
 * from the conversation:
 *  - If the purpose 'searchquery' is available for the current user, it rewrites the latest message into a self-contained
 *    search query, using the conversation history including the AI answers.
 *  - Otherwise (purpose not configured, limit reached, request failed, no usable search query) the last user messages are
 *    joined (see {@see self::FALLBACK_USER_MESSAGES}).
 * Without a conversation history the latest message is used unchanged, so no additional AI request is needed.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class search_query_builder {
    /** @var string Name of the purpose generating search queries. */
    public const PURPOSE = 'searchquery';

    /** @var int Number of user messages joined by the fallback, including the latest message. */
    public const FALLBACK_USER_MESSAGES = 2;

    /**
     * Builds the search text for the latest message of a conversation.
     *
     * @param string $prompt the latest message of the user
     * @param array $conversationcontext the conversation context of the request in the format of the option
     *  {@see conversationcontext::OPTION_NAME}, empty if the request has no conversation
     * @param string $component the component from which the request is being performed
     * @param int $contextid the context id from which the request is being performed
     * @return string the text to embed for the similarity search
     */
    public function build(string $prompt, array $conversationcontext, string $component, int $contextid): string {
        // System messages contain instructions (system prompt, persona, agent instructions), not the conversation.
        $history = array_values(array_filter(
            $conversationcontext,
            fn(array $entry): bool => $entry['sender'] !== 'system'
        ));
        if (empty($history)) {
            return $prompt;
        }

        if ($this->is_purpose_available($contextid)) {
            $query = $this->generate_query($prompt, $history, $component, $contextid);
            if ($query !== '') {
                return $query;
            }
        }
        return $this->build_fallback_query($prompt, $history);
    }

    /**
     * Checks whether the current user may use the purpose generating search queries in the given context.
     *
     * The purpose is not available if the tenant manager did not assign an AI tool to it, if it is disabled or restricted,
     * or if the user reached its request limit.
     *
     * @param int $contextid the context id of the request
     * @return bool true if the purpose is available
     */
    protected function is_purpose_available(int $contextid): bool {
        global $USER;
        $aiconfig = ai_manager_utils::get_ai_config($USER, $contextid, null, [self::PURPOSE]);
        if ($aiconfig['availability']['available'] !== ai_manager_utils::AVAILABILITY_AVAILABLE) {
            return false;
        }
        foreach ($aiconfig['purposes'] as $purposeconfig) {
            if ($purposeconfig['purpose'] === self::PURPOSE) {
                return $purposeconfig['available'] === ai_manager_utils::AVAILABILITY_AVAILABLE;
            }
        }
        // The purpose subplugin is not installed.
        return false;
    }

    /**
     * Lets the AI tool rewrite the latest message into a self-contained search query.
     *
     * @param string $prompt the latest message of the user
     * @param array $history the conversation history without system messages
     * @param string $component the component from which the request is being performed
     * @param int $contextid the context id from which the request is being performed
     * @return string the search query, empty if the request failed or the AI tool did not return a usable search query (the
     *  purpose discards outputs exceeding its maximum length, see {@see \aipurpose_searchquery\purpose::format_output()})
     */
    protected function generate_query(string $prompt, array $history, string $component, int $contextid): string {
        $response = (new manager(self::PURPOSE))->perform_request(
            $prompt,
            $component,
            $contextid,
            [conversationcontext::OPTION_NAME => $history]
        );
        // A failed search query request must not fail the request of the user, the fallback is used instead.
        if ($response->get_code() !== 200) {
            return '';
        }
        return $response->get_content();
    }

    /**
     * Joins the last user messages of the conversation including the latest message.
     *
     * Keeps the topic of the previous question for follow-up questions, but cannot resolve references to the AI answers.
     *
     * @param string $prompt the latest message of the user
     * @param array $history the conversation history without system messages in chronological order
     * @return string the joined user messages, the oldest first
     */
    protected function build_fallback_query(string $prompt, array $history): string {
        $usermessages = array_column(
            array_filter($history, fn(array $entry): bool => $entry['sender'] === 'user'),
            'message'
        );
        $messages = array_slice($usermessages, max(0, count($usermessages) - (self::FALLBACK_USER_MESSAGES - 1)));
        $messages[] = $prompt;
        return implode("\n\n", $messages);
    }
}

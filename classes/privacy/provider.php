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
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;

/**
 * Privacy provider for local_ai_content.
 *
 * Exports and deletes usage log data that records which users
 * triggered text extraction via the AI content service.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\core_userlist_provider,
    \core_privacy\local\request\plugin\provider {
    /**
     * Return metadata about the user data stored by this plugin.
     *
     * @param collection $collection The metadata collection.
     * @return collection The updated metadata collection.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table(
            'local_ai_content_usage',
            [
                'userid' => 'privacy:metadata:local_ai_content_usage:userid',
                'contenthash' => 'privacy:metadata:local_ai_content_usage:contenthash',
                'filename' => 'privacy:metadata:local_ai_content_usage:filename',
                'component' => 'privacy:metadata:local_ai_content_usage:component',
                'contextid' => 'privacy:metadata:local_ai_content_usage:contextid',
                'cachehit' => 'privacy:metadata:local_ai_content_usage:cachehit',
                'timecreated' => 'privacy:metadata:local_ai_content_usage:timecreated',
            ],
            'privacy:metadata:local_ai_content_usage'
        );
        return $collection;
    }

    /**
     * Get the list of contexts that contain user information for the specified user.
     *
     * @param int $userid The user to search.
     * @return contextlist The list of contexts.
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();
        $sql = "SELECT DISTINCT ctx.id
                  FROM {local_ai_content_usage} u
                  JOIN {context} ctx ON ctx.id = u.contextid
                 WHERE u.userid = :userid";
        $contextlist->add_from_sql($sql, ['userid' => $userid]);
        return $contextlist;
    }

    /**
     * Get the list of users who have data within a context.
     *
     * @param userlist $userlist The userlist containing the list of users.
     */
    public static function get_users_in_context(userlist $userlist): void {
        $context = $userlist->get_context();
        $sql = "SELECT DISTINCT userid
                  FROM {local_ai_content_usage}
                 WHERE contextid = :contextid AND userid IS NOT NULL";
        $userlist->add_from_sql('userid', $sql, ['contextid' => $context->id]);
    }

    /**
     * Export all user data for the specified approved contexts.
     *
     * @param approved_contextlist $contextlist The approved contexts to export data for.
     */
    public static function export_user_data(approved_contextlist $contextlist): void {
        global $DB;

        $userid = $contextlist->get_user()->id;
        foreach ($contextlist->get_contexts() as $context) {
            $records = $DB->get_records('local_ai_content_usage', [
                'userid' => $userid,
                'contextid' => $context->id,
            ], 'timecreated ASC');

            if (!empty($records)) {
                $exportdata = [];
                foreach ($records as $record) {
                    $exportdata[] = (object) [
                        'filename' => $record->filename,
                        'component' => $record->component,
                        'cachehit' => $record->cachehit ? 'yes' : 'no',
                        'timecreated' => \core_privacy\local\request\transform::datetime($record->timecreated),
                    ];
                }
                writer::with_context($context)->export_data(
                    [get_string('pluginname', 'local_ai_content')],
                    (object) ['usage' => $exportdata]
                );
            }
        }
    }

    /**
     * Delete all data for all users in the specified context.
     *
     * @param \context $context The specific context to delete data for.
     */
    public static function delete_data_for_all_users_in_context(\context $context): void {
        global $DB;
        $DB->delete_records('local_ai_content_usage', ['contextid' => $context->id]);
    }

    /**
     * Delete all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist The approved contexts and user information to delete data for.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        global $DB;

        $userid = $contextlist->get_user()->id;
        foreach ($contextlist->get_contexts() as $context) {
            $DB->delete_records('local_ai_content_usage', [
                'userid' => $userid,
                'contextid' => $context->id,
            ]);
        }
    }

    /**
     * Delete multiple users within a single context.
     *
     * @param approved_userlist $userlist The approved context and user information to delete data for.
     */
    public static function delete_data_for_users(approved_userlist $userlist): void {
        global $DB;

        $context = $userlist->get_context();
        $userids = $userlist->get_userids();
        if (empty($userids)) {
            return;
        }

        [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED);
        $params['contextid'] = $context->id;
        $DB->delete_records_select(
            'local_ai_content_usage',
            "contextid = :contextid AND userid {$insql}",
            $params
        );
    }
}

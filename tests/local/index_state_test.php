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

/**
 * Tests for index_state, especially summarizing the indexes of several embedding models.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(index_state::class)]
final class index_state_test extends \advanced_testcase {
    /**
     * Data provider for test_from_source_summarizes_status.
     *
     * @return array Datasets with the statuses of the indexes per model and the expected summarized status.
     */
    public static function from_source_summarizes_status_provider(): array {
        return [
            'no_index' => ['statuses' => [], 'expected' => index_state::STATUS_IDLE],
            'indexed' => ['statuses' => ['a' => model_index::STATUS_INDEXED], 'expected' => model_index::STATUS_INDEXED],
            'failed_before_running' => [
                'statuses' => ['a' => model_index::STATUS_RUNNING, 'b' => model_index::STATUS_FAILED],
                'expected' => model_index::STATUS_FAILED,
            ],
            'running_before_queued' => [
                'statuses' => ['a' => model_index::STATUS_QUEUED, 'b' => model_index::STATUS_RUNNING],
                'expected' => model_index::STATUS_RUNNING,
            ],
            'queued_before_indexed' => [
                'statuses' => ['a' => model_index::STATUS_INDEXED, 'b' => model_index::STATUS_QUEUED],
                'expected' => model_index::STATUS_QUEUED,
            ],
        ];
    }

    /**
     * The summarized status follows the precedence failed, running, queued, indexed and every model is listed.
     *
     * @param array $statuses The statuses of the indexes keyed by embedding model.
     * @param string $expected The expected summarized status.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('from_source_summarizes_status_provider')]
    public function test_from_source_summarizes_status(array $statuses, string $expected): void {
        $this->resetAfterTest();

        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $source = $generator->create_source(['contextid' => \context_system::instance()->id, 'allowindex' => true]);
        $indexes = [];
        foreach ($statuses as $model => $status) {
            $indexes[$model] = $generator->create_model_index([
                'sourceid' => $source->get_id(),
                'embeddingmodel' => $model,
                'status' => $status,
            ]);
        }

        $state = index_state::from_source($source, $indexes, null)->to_array();

        $this->assertSame($expected, $state['status']);
        $this->assertSame(array_keys($statuses), array_column($state['models'], 'model'));
        $this->assertSame(array_values($statuses), array_column($state['models'], 'status'));
    }

    /**
     * A failed index of the model of the current user can be restarted, a disabled source cannot be indexed at all.
     */
    public function test_from_source_can_index_current_model(): void {
        $this->resetAfterTest();

        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $source = $generator->create_source(['contextid' => \context_system::instance()->id, 'allowindex' => true]);
        $failed = $generator->create_model_index([
            'sourceid' => $source->get_id(),
            'embeddingmodel' => 'a',
            'status' => model_index::STATUS_FAILED,
        ]);

        $this->assertTrue(index_state::from_source($source, ['a' => $failed], 'a')->to_array()['canIndexCurrentModel']);
        $this->assertFalse(index_state::from_source($source, ['a' => $failed], null)->to_array()['canIndexCurrentModel']);

        $source->set_allowindex(false);
        $this->assertFalse(index_state::from_source($source, [], 'a')->to_array()['canIndexCurrentModel']);
    }
}

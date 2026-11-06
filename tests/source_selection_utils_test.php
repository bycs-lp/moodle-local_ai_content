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

use local_ai_content\source;

/**
 * Tests for source selection utilities.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(\local_ai_content\local\source_selection_utils::class)]
final class source_selection_utils_test extends \advanced_testcase {
    /**
     * Ensure non-course contexts still include global documents.
     */
    public function test_get_grouped_sources_for_system_context_includes_global_documents(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $globalsource = new source();
        $globalsource->set_contextid(\context_system::instance()->id);
        $globalsource->set_sourcetype(source::TYPE_DOCUMENT);
        $globalsource->set_name('Global source');
        $globalsource->set_enabled(true);
        $globalsource->set_allowindex(true);
        $globalsource->store();
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $generator->create_model_index(['sourceid' => $globalsource->get_id()]);

        $groups = \core\di::get(source_selection_utils::class)->get_grouped_sources_for_context(\context_system::instance()->id);

        $this->assertArrayHasKey('globaldocuments', $groups);
        $this->assertArrayHasKey('courseactivities', $groups);
        $this->assertArrayHasKey('externalsources', $groups);
        $this->assertCount(1, $groups['globaldocuments']);
        $this->assertEquals($globalsource->get_id(), (int)$groups['globaldocuments'][0]['id']);
        $this->assertSame([], $groups['courseactivities']);
        $this->assertSame([], $groups['externalsources']);
    }

    /**
     * Data provider for test_only_selectable_global_sources_are_offered.
     *
     * @return array Datasets with source type, enabled flag, statuses of the model indexes and expected visibility.
     */
    public static function only_selectable_global_sources_are_offered_provider(): array {
        return [
            'document_indexed' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => true,
                'indexstatuses' => [model_index::STATUS_INDEXED],
                'expected' => true,
            ],
            'document_not_indexed' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => true,
                'indexstatuses' => [],
                'expected' => false,
            ],
            'document_running' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => true,
                'indexstatuses' => [model_index::STATUS_RUNNING],
                'expected' => false,
            ],
            'document_failed' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => true,
                'indexstatuses' => [model_index::STATUS_FAILED],
                'expected' => false,
            ],
            'document_indexed_with_one_of_two_models' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => true,
                'indexstatuses' => [model_index::STATUS_FAILED, model_index::STATUS_INDEXED],
                'expected' => true,
            ],
            'document_indexed_but_disabled' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => false,
                'indexstatuses' => [model_index::STATUS_INDEXED],
                'expected' => false,
            ],
            'external_not_indexed_by_moodle' => [
                'sourcetype' => source::TYPE_EXTERNAL,
                'enabled' => true,
                'indexstatuses' => [],
                'expected' => true,
            ],
        ];
    }

    /**
     * Ensure only enabled sources indexed with at least one embedding model (or external sources) are offered.
     *
     * @param string $sourcetype The source type.
     * @param bool $enabled Whether the source is enabled.
     * @param string[] $indexstatuses The statuses of the indexes of the source, one index per embedding model.
     * @param bool $expected Whether the source is expected to be offered.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('only_selectable_global_sources_are_offered_provider')]
    public function test_only_selectable_global_sources_are_offered(
        string $sourcetype,
        bool $enabled,
        array $indexstatuses,
        bool $expected,
    ): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $globalsource = new source();
        $globalsource->set_contextid(\context_system::instance()->id);
        $globalsource->set_sourcetype($sourcetype);
        $globalsource->set_name('Global source');
        $globalsource->set_enabled($enabled);
        $globalsource->set_allowindex(!empty($indexstatuses));
        $globalsource->store();
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        foreach ($indexstatuses as $i => $status) {
            $generator->create_model_index([
                'sourceid' => $globalsource->get_id(),
                'embeddingmodel' => 'model-' . $i,
                'status' => $status,
            ]);
        }

        $ids = \core\di::get(source_selection_utils::class)->get_available_sourceids_for_context(\context_system::instance()->id);

        $this->assertSame($expected, in_array($globalsource->get_id(), $ids));
    }
}

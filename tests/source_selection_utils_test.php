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
        $globalsource->set_indexstatus(source::INDEXSTATUS_INDEXED);
        $globalsource->store();

        $groups = source_selection_utils::get_grouped_sources_for_context(\context_system::instance()->id);

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
     * @return array Datasets with source type, enabled flag, index status and expected visibility.
     */
    public static function only_selectable_global_sources_are_offered_provider(): array {
        return [
            'document_indexed' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => true,
                'indexstatus' => source::INDEXSTATUS_INDEXED,
                'expected' => true,
            ],
            'document_idle' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => true,
                'indexstatus' => source::INDEXSTATUS_IDLE,
                'expected' => false,
            ],
            'document_running' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => true,
                'indexstatus' => source::INDEXSTATUS_RUNNING,
                'expected' => false,
            ],
            'document_failed' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => true,
                'indexstatus' => source::INDEXSTATUS_FAILED,
                'expected' => false,
            ],
            'document_indexed_but_disabled' => [
                'sourcetype' => source::TYPE_DOCUMENT,
                'enabled' => false,
                'indexstatus' => source::INDEXSTATUS_INDEXED,
                'expected' => false,
            ],
            'external_not_indexed_by_moodle' => [
                'sourcetype' => source::TYPE_EXTERNAL,
                'enabled' => true,
                'indexstatus' => source::INDEXSTATUS_IDLE,
                'expected' => true,
            ],
        ];
    }

    /**
     * Ensure only enabled sources with finished indexing (or external sources) are offered.
     *
     * @param string $sourcetype The source type.
     * @param bool $enabled Whether the source is enabled.
     * @param string $indexstatus The index status of the source.
     * @param bool $expected Whether the source is expected to be offered.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('only_selectable_global_sources_are_offered_provider')]
    public function test_only_selectable_global_sources_are_offered(
        string $sourcetype,
        bool $enabled,
        string $indexstatus,
        bool $expected,
    ): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $globalsource = new source();
        $globalsource->set_contextid(\context_system::instance()->id);
        $globalsource->set_sourcetype($sourcetype);
        $globalsource->set_name('Global source');
        $globalsource->set_enabled($enabled);
        $globalsource->set_allowindex($indexstatus !== source::INDEXSTATUS_IDLE);
        $globalsource->set_indexstatus($indexstatus);
        $globalsource->store();

        $ids = source_selection_utils::get_available_sourceids_for_context(\context_system::instance()->id);

        $this->assertSame($expected, in_array($globalsource->get_id(), $ids));
    }
}

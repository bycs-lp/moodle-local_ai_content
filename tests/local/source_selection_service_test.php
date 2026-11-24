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
 * Tests for the source selection service.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(source_selection_service::class)]
final class source_selection_service_test extends \advanced_testcase {
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
        $globalsource->store();
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $generator->create_model_index(['sourceid' => $globalsource->get_id()]);

        $groups = \core\di::get(source_selection_service::class)->get_grouped_sources_for_context(\context_system::instance()->id);

        $this->assertArrayHasKey('globalDocuments', $groups);
        $this->assertArrayHasKey('courseActivities', $groups);
        $this->assertArrayHasKey('externalSources', $groups);
        $this->assertCount(1, $groups['globalDocuments']);
        $this->assertEquals($globalsource->get_id(), (int)$groups['globalDocuments'][0]['id']);
        $this->assertSame([], $groups['courseActivities']);
        $this->assertSame([], $groups['externalSources']);
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

        $ids = \core\di::get(source_selection_service::class)->get_available_sourceids_for_context(\context_system::instance()->id);

        $this->assertSame($expected, in_array($globalsource->get_id(), $ids));
    }

    /**
     * Data provider for test_outdated_flag_follows_index_of_current_model.
     *
     * @return array Datasets with the statuses of the indexes per model and the expected outdated flag.
     */
    public static function outdated_flag_follows_index_of_current_model_provider(): array {
        return [
            'current_model_indexed' => [
                'indexstatuses' => ['model-a' => model_index::STATUS_INDEXED],
                'expected' => false,
            ],
            'current_model_outdated' => [
                'indexstatuses' => ['model-a' => model_index::STATUS_OUTDATED],
                'expected' => true,
            ],
            'only_other_model_outdated' => [
                'indexstatuses' => ['model-a' => model_index::STATUS_INDEXED, 'model-b' => model_index::STATUS_OUTDATED],
                'expected' => false,
            ],
        ];
    }

    /**
     * Ensure a source is flagged as outdated if its index for the embedding model of the current user is outdated.
     *
     * @param string[] $indexstatuses The statuses of the indexes of the source by embedding model.
     * @param bool $expected Whether the source is expected to be flagged as outdated.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('outdated_flag_follows_index_of_current_model_provider')]
    public function test_outdated_flag_follows_index_of_current_model(array $indexstatuses, bool $expected): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $resolver = $this->createMock(embedding_model_resolver::class);
        $resolver->method('get_current_model')->willReturn('model-a');
        \core\di::set(embedding_model_resolver::class, $resolver);
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $globalsource = $generator->create_source(['contextid' => \context_system::instance()->id]);
        foreach ($indexstatuses as $model => $status) {
            $generator->create_model_index([
                'sourceid' => $globalsource->get_id(),
                'embeddingmodel' => $model,
                'status' => $status,
            ]);
        }

        $groups = \core\di::get(source_selection_service::class)->get_grouped_sources_for_context(\context_system::instance()->id);

        $this->assertCount(1, $groups['globalDocuments']);
        $this->assertSame($expected, $groups['globalDocuments'][0]['outdated']);
    }

    /**
     * Ensure only existing, selectable and accessible sources are stored as selection and the stored ids are returned.
     */
    public function test_save_selected_sourceids_drops_invalid_ids(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);
        $systemcontextid = \context_system::instance()->id;
        $coursecontext = \context_course::instance($course->id);
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');

        $valid = $generator->create_source(['contextid' => $systemcontextid]);
        $generator->create_model_index(['sourceid' => $valid->get_id()]);
        $notindexed = $generator->create_source(['contextid' => $systemcontextid]);
        $disabled = $generator->create_source(['contextid' => $systemcontextid, 'enabled' => false]);
        $generator->create_model_index(['sourceid' => $disabled->get_id()]);
        // The user is not enrolled in the course, so the source is not accessible.
        $inaccessible = $generator->create_source(['contextid' => $coursecontext->id]);
        $generator->create_model_index(['sourceid' => $inaccessible->get_id()]);
        $nonexistentid = $inaccessible->get_id() + 1000;

        $requested = implode(',', [
            $nonexistentid,
            $inaccessible->get_id(),
            $disabled->get_id(),
            $notindexed->get_id(),
            $valid->get_id(),
        ]);
        $service = \core\di::get(source_selection_service::class);
        $saved = $service->save_selected_sourceids($coursecontext->id, $requested);

        $this->assertSame((string)$valid->get_id(), $saved);
        $this->assertSame((string)$valid->get_id(), $service->get_selected_sourceids($coursecontext->id));
    }

    /**
     * Ensure an empty selection clears the stored selection.
     */
    public function test_save_selected_sourceids_with_empty_string_clears_selection(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $contextid = \context_system::instance()->id;
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $source = $generator->create_source(['contextid' => $contextid]);
        $generator->create_model_index(['sourceid' => $source->get_id()]);
        $service = \core\di::get(source_selection_service::class);
        $service->save_selected_sourceids($contextid, (string)$source->get_id());

        $saved = $service->save_selected_sourceids($contextid, '');

        $this->assertSame('', $saved);
        $this->assertSame('', $service->get_selected_sourceids($contextid));
    }
}

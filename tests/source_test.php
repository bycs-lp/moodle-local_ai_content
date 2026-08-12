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

/**
 * Tests for source model persistence.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(\local_ai_content\source::class)]
final class source_test extends \advanced_testcase {
    /**
     * Ensure indexing tracking fields are persisted.
     */
    public function test_store_persists_index_tracking_fields(): void {
        $this->resetAfterTest();

        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);

        $source = new source();
        $source->set_contextid(\core\context\system::instance()->id);
        $source->set_sourcetype(source::TYPE_DOCUMENT);
        $source->set_name('Test source');
        $source->set_content('Some content');
        $source->set_enabled(true);
        $source->set_allowindex(true);
        $source->set_indexstatus(source::INDEXSTATUS_QUEUED);
        $source->set_indextaskid(12345);
        $source->store();

        $reloaded = source::get_record(['id' => $source->get_id()]);

        $this->assertNotNull($reloaded);
        $this->assertEquals(source::INDEXSTATUS_QUEUED, $reloaded->get_indexstatus());
        $this->assertEquals(12345, $reloaded->get_indextaskid());
    }
}



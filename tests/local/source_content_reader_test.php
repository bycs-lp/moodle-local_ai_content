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
 * Tests for source_content_reader.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(source_content_reader::class)]
final class source_content_reader_test extends \advanced_testcase {
    /**
     * Data provider for test_get_chunks_document.
     *
     * @return array Datasets with the document content and the expected chunks.
     */
    public static function get_chunks_document_provider(): array {
        return [
            'short_document' => [
                'content' => 'Short document.',
                'expected' => ['Short document.'],
            ],
            'long_multibyte_document' => [
                'content' => str_repeat('ä', 2500),
                'expected' => [str_repeat('ä', 1000), str_repeat('ä', 1000), str_repeat('ä', 700)],
            ],
        ];
    }

    /**
     * Test that document sources are split into overlapping chunks like module sources.
     *
     * @param string $content The content of the document source.
     * @param string[] $expected The expected chunks.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('get_chunks_document_provider')]
    public function test_get_chunks_document(string $content, array $expected): void {
        $this->resetAfterTest();
        /** @var \local_ai_content_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('local_ai_content');
        $source = $generator->create_source(['contextid' => \core\context\system::instance()->id, 'content' => $content]);

        $this->assertSame($expected, \core\di::get(source_content_reader::class)->get_chunks($source));
    }
}


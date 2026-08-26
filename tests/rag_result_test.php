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

use local_ai_content\local\rag_result;
use local_ai_content\local\rag_source;

/**
 * Tests for rag_result DTO.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(\local_ai_content\local\rag_result::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(\local_ai_content\local\rag_source::class)]
final class rag_result_test extends \advanced_testcase {
    /**
     * Ensure rag_result exports retrieved text and references in API-safe form.
     */
    public function test_to_array_contains_retrieved_text_and_sources(): void {
        $this->resetAfterTest();

        $result = new rag_result('Chunk A\n\n---\n\nChunk B', [
            new rag_source(123, 'Resource 1', 'https://example.org/r1', 'p. 2'),
            new rag_source(456, 'Resource 2', '', ''),
        ]);

        $array = $result->to_array();

        $this->assertEquals('Chunk A\n\n---\n\nChunk B', $array['retrievedText']);
        $this->assertCount(2, $array['sources']);
        $this->assertEquals(123, $array['sources'][0]['sourceId']);
        $this->assertEquals('Resource 1', $array['sources'][0]['title']);
        $this->assertEquals('https://example.org/r1', $array['sources'][0]['url']);
        $this->assertEquals('p. 2', $array['sources'][0]['locator']);
        $this->assertTrue($result->has_sources());
    }
}

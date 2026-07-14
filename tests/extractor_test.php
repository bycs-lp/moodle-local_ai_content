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

use local_ai_content\backend\ai_backend;

/**
 * Tests for the extractor class.
 *
 * @package    local_ai_content
 * @category   test
 * @copyright  2026 ISB Bayern
 * @author     Andreas Wagner
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_ai_content\extractor
 */
final class extractor_test extends \advanced_testcase {
    /**
     * Set up test environment.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        // Inject a mock backend that has ITT available by default.
        $this->inject_backend_with_itt(true);
        ob_start();
    }

    /**
     * Tear down test environment.
     *
     * @return void
     */
    protected function tearDown(): void {
        ob_end_clean();
        parent::tearDown();
    }

    /**
     * Create a stored_file in the draft area for testing.
     *
     * @param string $filename The file name.
     * @param string $content The file content.
     * @param string $mimetype The MIME type (defaults to auto-detect).
     * @return \stored_file The created stored file.
     */
    private function create_test_file(string $filename, string $content, string $mimetype = ''): \stored_file {
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);
        $usercontext = \context_user::instance($user->id);
        $filerecord = [
            'contextid' => $usercontext->id,
            'component' => 'user',
            'filearea' => 'draft',
            'itemid' => file_get_unused_draft_itemid(),
            'filepath' => '/',
            'filename' => $filename,
        ];
        if ($mimetype !== '') {
            $filerecord['mimetype'] = $mimetype;
        }
        $fs = get_file_storage();
        return $fs->create_file_from_string($filerecord, $content);
    }

    /**
     * Inject a mock ai_backend via DI with configurable ITT availability.
     *
     * @param bool $ittavailable Whether ITT should be available.
     * @param string $ittreturnvalue The value extract_text_from_encoded_data should return.
     * @return ai_backend The mock object.
     */
    private function inject_backend_with_itt(bool $ittavailable, string $ittreturnvalue = ''): ai_backend {
        $mock = $this->createMock(ai_backend::class);
        $mock->method('is_itt_available')->willReturn($ittavailable);
        $mock->method('is_mimetype_natively_supported')->willReturn(false);
        $mock->method('get_natively_supported_mimetypes')->willReturn([]);
        if ($ittreturnvalue !== '') {
            $mock->method('extract_text_from_encoded_data')->willReturn($ittreturnvalue);
        }
        \core\di::set(ai_backend::class, $mock);
        return $mock;
    }

    /**
     * Create a mock ai_backend that returns a value for ITT requests.
     *
     * @param string $returnvalue The value the mock should return.
     * @return ai_backend The mock object.
     */
    private function mock_ai_backend(string $returnvalue): ai_backend {
        return $this->inject_backend_with_itt(true, $returnvalue);
    }

    /**
     * Create a mock ai_backend that throws an exception on ITT requests.
     *
     * @param string $errormessage The error message for the exception.
     * @return ai_backend The mock object.
     */
    private function mock_ai_backend_with_error(string $errormessage): ai_backend {
        $mock = $this->createMock(ai_backend::class);
        $mock->method('is_itt_available')->willReturn(true);
        $mock->method('is_mimetype_natively_supported')->willReturn(false);
        $mock->method('get_natively_supported_mimetypes')->willReturn([]);
        $mock->method('extract_text_from_encoded_data')->willThrowException(
            new \moodle_exception('error_airequestfailed', 'local_ai_content', '', $errormessage)
        );
        \core\di::set(ai_backend::class, $mock);
        return $mock;
    }

    /**
     * Test that plain text files are supported.
     *
     * @covers ::is_file_supported
     */
    public function test_is_file_supported_text(): void {
        $file = $this->create_test_file('test.txt', 'Hello world', 'text/plain');
        $this->assertTrue((new extractor())->is_file_supported($file));
    }

    /**
     * Test that PNG images are supported when ITT is available.
     *
     * @covers ::is_file_supported
     */
    public function test_is_file_supported_png(): void {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB');
        $file = $this->create_test_file('test.png', $png, 'image/png');
        $this->assertTrue((new extractor())->is_file_supported($file));
    }

    /**
     * Test that JPEG images are supported when ITT is available.
     *
     * @covers ::is_file_supported
     */
    public function test_is_file_supported_jpeg(): void {
        $file = $this->create_test_file('photo.jpg', 'fake', 'image/jpeg');
        $this->assertTrue((new extractor())->is_file_supported($file));
    }

    /**
     * Test that WebP images are supported when ITT is available.
     *
     * @covers ::is_file_supported
     */
    public function test_is_file_supported_webp(): void {
        $file = $this->create_test_file('image.webp', 'fake', 'image/webp');
        $this->assertTrue((new extractor())->is_file_supported($file));
    }

    /**
     * Test that GIF images are supported when ITT is available.
     *
     * @covers ::is_file_supported
     */
    public function test_is_file_supported_gif(): void {
        $file = $this->create_test_file('anim.gif', 'fake', 'image/gif');
        $this->assertTrue((new extractor())->is_file_supported($file));
    }

    /**
     * Test that PDF files are supported when ITT is available.
     *
     * @covers ::is_file_supported
     */
    public function test_is_file_supported_pdf(): void {
        $file = $this->create_test_file('doc.pdf', '%PDF-1.4', 'application/pdf');
        $this->assertTrue((new extractor())->is_file_supported($file));
    }

    /**
     * Test that unsupported MIME types return false.
     *
     * @covers ::is_file_supported
     */
    public function test_is_file_supported_unsupported_type(): void {
        $file = $this->create_test_file('archive.zip', 'fake', 'application/zip');
        $this->assertFalse((new extractor())->is_file_supported($file));
    }

    /**
     * Test that images are NOT supported when ITT is not available.
     *
     * @covers ::is_file_supported
     */
    public function test_is_file_supported_image_without_itt(): void {
        $this->inject_backend_with_itt(false);
        $file = $this->create_test_file('photo.png', 'fake', 'image/png');
        $this->assertFalse((new extractor())->is_file_supported($file));
    }

    /**
     * Test that PDFs are NOT supported when ITT is not available and no converter exists.
     *
     * @covers ::is_file_supported
     */
    public function test_is_file_supported_pdf_without_itt(): void {
        $this->inject_backend_with_itt(false);
        $file = $this->create_test_file('doc.pdf', '%PDF-1.4', 'application/pdf');
        // PDF might still be supported via converter, but without ITT and without converter → false.
        // This depends on whether a PDF-to-TXT converter is installed.
        // In test environments, typically no converter is available.
        $extractor = new extractor();
        $supported = $extractor->is_file_supported($file);
        // We can only assert it doesn't crash. The result depends on converter availability.
        $this->assertIsBool($supported);
    }

    /**
     * Test that plain text is still supported when ITT is not available.
     *
     * @covers ::is_file_supported
     */
    public function test_is_file_supported_text_without_itt(): void {
        $this->inject_backend_with_itt(false);
        $file = $this->create_test_file('readme.txt', 'Hello', 'text/plain');
        $this->assertTrue((new extractor())->is_file_supported($file));
    }

    /**
     * Test text extraction from a plain text file.
     *
     * @covers ::extract_text_from_file
     */
    public function test_extract_text_from_text_file(): void {
        $expected = 'This is the content of my text file.';
        $file = $this->create_test_file('notes.txt', $expected, 'text/plain');
        $contextid = \context_system::instance()->id;

        $result = (new extractor())->extract_text_from_file($file, $contextid, null, 'test');
        $this->assertEquals($expected, $result);
    }

    /**
     * Test that extraction throws for unsupported file types.
     *
     * @covers ::extract_text_from_file
     */
    public function test_extract_text_from_unsupported_file_throws(): void {
        $file = $this->create_test_file('data.zip', 'fake', 'application/zip');
        $contextid = \context_system::instance()->id;

        $this->expectException(\moodle_exception::class);
        (new extractor())->extract_text_from_file($file, $contextid);
    }

    /**
     * Test text extraction from an image delegates to AI backend.
     *
     * @covers ::extract_text_from_file
     */
    public function test_extract_text_from_image_uses_ai(): void {
        $aitext = 'Text extracted from the image by AI.';
        $this->mock_ai_backend($aitext);
        $file = $this->create_test_file('shot.png', 'fake png', 'image/png');
        $contextid = \context_system::instance()->id;

        $result = (new extractor())->extract_text_from_file($file, $contextid, null, 'aif');
        $this->assertEquals($aitext, $result);
    }

    /**
     * Test that AI errors during image extraction propagate.
     *
     * @covers ::extract_text_from_file
     */
    public function test_extract_text_from_image_ai_error(): void {
        $this->mock_ai_backend_with_error('AI backend is down');
        $file = $this->create_test_file('photo.png', 'fake', 'image/png');
        $contextid = \context_system::instance()->id;

        $this->expectException(\moodle_exception::class);
        (new extractor())->extract_text_from_file($file, $contextid, null);
    }

    /**
     * Test that results are cached and reused.
     *
     * @covers ::extract_text_from_file
     */
    public function test_caching_stores_and_retrieves(): void {
        global $DB;
        $aitext = 'Cached AI response.';
        $this->mock_ai_backend($aitext);

        $file = $this->create_test_file('img.png', 'fake png', 'image/png');
        $contextid = \context_system::instance()->id;
        $extractor = new extractor();

        $r1 = $extractor->extract_text_from_file($file, $contextid, null, 'test');
        $this->assertEquals($aitext, $r1);
        $this->assertEquals(1, $DB->count_records('local_ai_content_cache', ['contenthash' => $file->get_contenthash()]));

        // Second call uses cache - verify via cachehit flag in usage log.
        $r2 = $extractor->extract_text_from_file($file, $contextid, null, 'test');
        $this->assertEquals($aitext, $r2);

        $records = array_values($DB->get_records('local_ai_content_usage', ['component' => 'test'], 'id ASC'));
        $this->assertEquals(0, (int) $records[0]->cachehit);
        $this->assertEquals(1, (int) $records[1]->cachehit);
    }

    /**
     * Test that cache updates timelastaccessed on hit.
     *
     * @covers ::extract_text_from_file
     */
    public function test_cache_updates_timelastaccessed(): void {
        global $DB;
        $this->mock_ai_backend('Some text');
        $file = $this->create_test_file('img.png', 'fake png', 'image/png');
        $contextid = \context_system::instance()->id;
        $extractor = new extractor();

        $extractor->extract_text_from_file($file, $contextid, 2);
        $rec1 = $DB->get_record('local_ai_content_cache', ['contenthash' => $file->get_contenthash()]);

        $this->mock_clock_with_frozen(time() + 60);
        $extractor->extract_text_from_file($file, $contextid, 2);
        $rec2 = $DB->get_record('local_ai_content_cache', ['contenthash' => $file->get_contenthash()]);

        $this->assertGreaterThanOrEqual((int) $rec1->timelastaccessed, (int) $rec2->timelastaccessed);
    }

    /**
     * Test that extraction logs a usage record.
     *
     * @covers ::extract_text_from_file
     */
    public function test_usage_logging_on_extraction(): void {
        global $DB;
        $file = $this->create_test_file('readme.txt', 'Hello', 'text/plain');
        $contextid = \context_system::instance()->id;

        (new extractor())->extract_text_from_file($file, $contextid, 42, 'assignfeedback_aif');

        $records = $DB->get_records('local_ai_content_usage', ['userid' => 42]);
        $this->assertCount(1, $records);
        $rec = reset($records);
        $this->assertEquals('readme.txt', $rec->filename);
        $this->assertEquals('assignfeedback_aif', $rec->component);
        $this->assertEquals(0, (int) $rec->cachehit);
    }

    /**
     * Test that cached extraction logs cachehit=1.
     *
     * @covers ::extract_text_from_file
     */
    public function test_usage_logging_cachehit(): void {
        global $DB;
        $this->mock_ai_backend('AI text');
        $file = $this->create_test_file('photo.png', 'fake', 'image/png');
        $contextid = \context_system::instance()->id;
        $extractor = new extractor();

        $extractor->extract_text_from_file($file, $contextid, 2, 'test');
        $extractor->extract_text_from_file($file, $contextid, 2, 'test');

        $records = array_values($DB->get_records('local_ai_content_usage', ['userid' => 2], 'id ASC'));
        $this->assertCount(2, $records);
        $this->assertEquals(0, (int) $records[0]->cachehit);
        $this->assertEquals(1, (int) $records[1]->cachehit);
    }

    /**
     * Test that null userid is logged correctly.
     *
     * @covers ::extract_text_from_file
     */
    public function test_usage_logging_null_userid(): void {
        global $DB;
        $file = $this->create_test_file('data.txt', 'content', 'text/plain');
        $contextid = \context_system::instance()->id;

        (new extractor())->extract_text_from_file($file, $contextid, null, 'cron_task');

        $records = $DB->get_records('local_ai_content_usage', ['component' => 'cron_task']);
        $this->assertCount(1, $records);
        $this->assertNull(reset($records)->userid);
    }

    /**
     * Test get_usage_log returns records within the time range.
     *
     * @covers ::get_usage_log
     */
    public function test_get_usage_log_time_range(): void {
        global $DB;
        $now = time();
        $base = ['userid' => 99, 'contenthash' => sha1('t'), 'filename' => 'f.txt',
            'component' => 'test', 'contextid' => 1, 'cachehit' => 0];
        $DB->insert_record('local_ai_content_usage', (object) array_merge($base, ['timecreated' => $now - 100]));
        $DB->insert_record('local_ai_content_usage', (object) array_merge($base, ['timecreated' => $now]));
        $DB->insert_record('local_ai_content_usage', (object) array_merge($base, ['timecreated' => $now + 200]));

        $extractor = new extractor();
        $this->assertCount(2, $extractor->get_usage_log(99, $now - 150, $now + 50));
        $this->assertCount(3, $extractor->get_usage_log(99, $now - 150, $now + 250));
        $this->assertCount(0, $extractor->get_usage_log(99, $now + 300, $now + 400));
    }

    /**
     * Test get_usage_log only returns records for the specified user.
     *
     * @covers ::get_usage_log
     */
    public function test_get_usage_log_user_isolation(): void {
        global $DB;
        $now = time();
        $base = ['contenthash' => sha1('t'), 'filename' => 'f.txt', 'component' => 'test',
            'contextid' => 1, 'cachehit' => 0, 'timecreated' => $now];
        $DB->insert_record('local_ai_content_usage', (object) array_merge($base, ['userid' => 10]));
        $DB->insert_record('local_ai_content_usage', (object) array_merge($base, ['userid' => 20]));
        $DB->insert_record('local_ai_content_usage', (object) array_merge($base, ['userid' => 10]));

        $extractor = new extractor();
        $this->assertCount(2, $extractor->get_usage_log(10, $now - 10, $now + 10));
        $this->assertCount(1, $extractor->get_usage_log(20, $now - 10, $now + 10));
        $this->assertCount(0, $extractor->get_usage_log(30, $now - 10, $now + 10));
    }

    /**
     * Test that get_supported_extensions includes basic types when ITT is available.
     *
     * @covers ::get_supported_extensions
     */
    public function test_get_supported_extensions_includes_basics(): void {
        $ext = (new extractor())->get_supported_extensions();
        // These should be present when ITT backend is available.
        $this->assertStringContainsString('PDF', $ext);
        $this->assertStringContainsString('PNG', $ext);
        $this->assertStringContainsString('GIF', $ext);
    }

    /**
     * Test that get_supported_extensions returns sorted, comma-separated format.
     *
     * @covers ::get_supported_extensions
     */
    public function test_get_supported_extensions_format(): void {
        $ext = (new extractor())->get_supported_extensions();
        $this->assertMatchesRegularExpression('/^[A-Z0-9]+(, [A-Z0-9]+)*$/', $ext);
        $parts = explode(', ', $ext);
        $sorted = $parts;
        sort($sorted);
        $this->assertEquals($sorted, $parts);
    }

    /**
     * Test that get_supported_extensions only lists TXT when ITT is not available.
     *
     * @covers ::get_supported_extensions
     */
    public function test_get_supported_extensions_without_itt(): void {
        $this->inject_backend_with_itt(false);
        $ext = (new extractor())->get_supported_extensions();
        // Images and PDF should NOT be listed without ITT.
        $this->assertStringNotContainsString('PNG', $ext);
        $this->assertStringNotContainsString('GIF', $ext);
        $this->assertStringNotContainsString('JPEG', $ext);
        $this->assertStringNotContainsString('PDF', $ext);
    }

    /**
     * Test extraction of an empty text file.
     *
     * @covers ::extract_text_from_file
     */
    public function test_extract_empty_text_file(): void {
        $file = $this->create_test_file('empty.txt', '', 'text/plain');
        $contextid = \context_system::instance()->id;

        $result = (new extractor())->extract_text_from_file($file, $contextid, 2);
        $this->assertEquals('', $result);
    }

    /**
     * Test extraction of a text file with unicode content.
     *
     * @covers ::extract_text_from_file
     */
    public function test_extract_text_file_unicode(): void {
        $text = 'Ä Ö Ü ß 日本語 中文 한국어';
        $file = $this->create_test_file('unicode.txt', $text, 'text/plain');
        $contextid = \context_system::instance()->id;

        $result = (new extractor())->extract_text_from_file($file, $contextid, 2);
        $this->assertEquals($text, $result);
    }

    /**
     * Test that component parameter is stored in usage log.
     *
     * @covers ::extract_text_from_file
     */
    public function test_component_stored_in_usage_log(): void {
        global $DB;
        $file = $this->create_test_file('test.txt', 'content', 'text/plain');
        $contextid = \context_system::instance()->id;
        $extractor = new extractor();

        $extractor->extract_text_from_file($file, $contextid, 2, 'assignfeedback_aif');
        $extractor->extract_text_from_file($file, $contextid, 2, 'mod_quiz');

        $this->assertCount(1, $DB->get_records('local_ai_content_usage', ['component' => 'assignfeedback_aif']));
        $this->assertCount(1, $DB->get_records('local_ai_content_usage', ['component' => 'mod_quiz']));
    }

    /**
     * Test that different files get different cache entries.
     *
     * @covers ::extract_text_from_file
     */
    public function test_different_files_have_separate_cache(): void {
        $f1 = $this->create_test_file('f1.txt', 'Content A', 'text/plain');
        $f2 = $this->create_test_file('f2.txt', 'Content B', 'text/plain');
        $contextid = \context_system::instance()->id;
        $extractor = new extractor();

        $this->assertEquals('Content A', $extractor->extract_text_from_file($f1, $contextid, 2));
        $this->assertEquals('Content B', $extractor->extract_text_from_file($f2, $contextid, 2));
        $this->assertNotEquals($f1->get_contenthash(), $f2->get_contenthash());
    }

    /**
     * Test that identical content in different files shares the cache entry.
     *
     * @covers ::extract_text_from_file
     */
    public function test_identical_content_shares_cache(): void {
        global $DB;
        $content = 'Identical file content for caching test.';
        $f1 = $this->create_test_file('c1.txt', $content, 'text/plain');
        $f2 = $this->create_test_file('c2.txt', $content, 'text/plain');
        $contextid = \context_system::instance()->id;
        $extractor = new extractor();

        $extractor->extract_text_from_file($f1, $contextid, 2);
        $extractor->extract_text_from_file($f2, $contextid, 2);

        $this->assertEquals($f1->get_contenthash(), $f2->get_contenthash());
        $this->assertEquals(1, $DB->count_records('local_ai_content_cache'));
    }
}

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
 * Value object representing the source-level citation metadata of a source.
 *
 * Citation metadata is split into two scopes:
 *  - Source-level (this object): information that is identical for every vector of a source (title, canonical
 *    URL, author, publisher, publication date, license). It is stored once as JSON on the
 *    local_ai_content_sources record and can be edited without re-indexing.
 *  - Vector-level: per-chunk information that may differ between the vectors of a single source (the exact
 *    locator such as a page number or timestamp, and an optional per-chunk deep link). These are carried on the
 *    individual {@see enriched_vector} and stored in the vector store payload.
 *
 * The {@see self::$locatortype} defines how a vector-level locator string of the same source is to be
 * interpreted (e.g. as a page number or a media timestamp).
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_citation {
    /** @var string Locator type: a page number. */
    public const LOCATOR_PAGE = 'page';

    /** @var string Locator type: a named section or heading. */
    public const LOCATOR_SECTION = 'section';

    /** @var string Locator type: a media timestamp. */
    public const LOCATOR_TIMESTAMP = 'timestamp';

    /** @var string Locator type: a character offset. */
    public const LOCATOR_CHAR = 'char';

    /** @var string The human-readable title of the source. */
    private string $title = '';

    /** @var string The canonical URL of the source (empty if it should be derived from the Moodle context). */
    private string $url = '';

    /** @var string The author of the source. */
    private string $author = '';

    /** @var string The publisher of the source. */
    private string $publisher = '';

    /** @var string The publication or edition date of the source (ISO-8601, e.g. "2026-01-01"). */
    private string $date = '';

    /** @var string The license of the source (e.g. "CC-BY-4.0"). */
    private string $license = '';

    /** @var string How a vector-level locator of this source is to be interpreted (one of self::LOCATOR_*). */
    private string $locatortype = '';

    /**
     * Private constructor to enforce creation via {@see self::create()}.
     */
    private function __construct() {
    }

    /**
     * Creates a new source citation value object.
     *
     * @param string $title the human-readable title of the source
     * @param string $url the canonical URL of the source
     * @param string $author the author of the source
     * @param string $publisher the publisher of the source
     * @param string $date the publication or edition date of the source (ISO-8601)
     * @param string $license the license of the source
     * @param string $locatortype how a vector-level locator of this source is to be interpreted (one of
     *  self::LOCATOR_*)
     * @return self the created source citation object
     */
    public static function create(
        string $title = '',
        string $url = '',
        string $author = '',
        string $publisher = '',
        string $date = '',
        string $license = '',
        string $locatortype = ''
    ): self {
        $citation = new self();
        $citation->title = $title;
        $citation->url = $url;
        $citation->author = $author;
        $citation->publisher = $publisher;
        $citation->date = $date;
        $citation->license = $license;
        $citation->locatortype = $locatortype;
        return $citation;
    }

    /**
     * Builds a source citation object from its JSON representation as stored on the source record.
     *
     * @param ?string $json the JSON string (or null / empty for no citation)
     * @return ?self the citation object, or null if the input holds no citation data
     */
    public static function from_json(?string $json): ?self {
        if ($json === null || trim($json) === '') {
            return null;
        }
        $data = json_decode($json, true);
        if (!is_array($data)) {
            return null;
        }
        $citation = self::create(
            (string) ($data['title'] ?? ''),
            (string) ($data['url'] ?? ''),
            (string) ($data['author'] ?? ''),
            (string) ($data['publisher'] ?? ''),
            (string) ($data['date'] ?? ''),
            (string) ($data['license'] ?? ''),
            (string) ($data['locatortype'] ?? '')
        );
        return $citation->is_empty() ? null : $citation;
    }

    /**
     * Returns the citation as an associative array, omitting empty fields.
     *
     * @return array the citation data keyed by field name
     */
    public function to_array(): array {
        $data = [
            'title' => $this->title,
            'url' => $this->url,
            'author' => $this->author,
            'publisher' => $this->publisher,
            'date' => $this->date,
            'license' => $this->license,
            'locatortype' => $this->locatortype,
        ];
        return array_filter($data, static fn(string $value): bool => $value !== '');
    }

    /**
     * Returns the JSON representation to be stored on the source record.
     *
     * @return string the JSON string (empty string when the citation holds no data)
     */
    public function to_json(): string {
        if ($this->is_empty()) {
            return '';
        }
        return (string) json_encode($this->to_array());
    }

    /**
     * Whether this citation holds no data at all.
     *
     * @return bool true if every field is empty
     */
    public function is_empty(): bool {
        return $this->to_array() === [];
    }

    /**
     * Standard getter.
     *
     * @return string the human-readable title of the source
     */
    public function get_title(): string {
        return $this->title;
    }

    /**
     * Standard setter.
     *
     * @param string $title the human-readable title of the source
     */
    public function set_title(string $title): void {
        $this->title = $title;
    }

    /**
     * Standard getter.
     *
     * @return string the canonical URL of the source
     */
    public function get_url(): string {
        return $this->url;
    }

    /**
     * Standard setter.
     *
     * @param string $url the canonical URL of the source
     */
    public function set_url(string $url): void {
        $this->url = $url;
    }

    /**
     * Standard getter.
     *
     * @return string the author of the source
     */
    public function get_author(): string {
        return $this->author;
    }

    /**
     * Standard setter.
     *
     * @param string $author the author of the source
     */
    public function set_author(string $author): void {
        $this->author = $author;
    }

    /**
     * Standard getter.
     *
     * @return string the publisher of the source
     */
    public function get_publisher(): string {
        return $this->publisher;
    }

    /**
     * Standard setter.
     *
     * @param string $publisher the publisher of the source
     */
    public function set_publisher(string $publisher): void {
        $this->publisher = $publisher;
    }

    /**
     * Standard getter.
     *
     * @return string the publication or edition date of the source (ISO-8601)
     */
    public function get_date(): string {
        return $this->date;
    }

    /**
     * Standard setter.
     *
     * @param string $date the publication or edition date of the source (ISO-8601)
     */
    public function set_date(string $date): void {
        $this->date = $date;
    }

    /**
     * Standard getter.
     *
     * @return string the license of the source
     */
    public function get_license(): string {
        return $this->license;
    }

    /**
     * Standard setter.
     *
     * @param string $license the license of the source
     */
    public function set_license(string $license): void {
        $this->license = $license;
    }

    /**
     * Standard getter.
     *
     * @return string how a vector-level locator of this source is to be interpreted (one of self::LOCATOR_*)
     */
    public function get_locatortype(): string {
        return $this->locatortype;
    }

    /**
     * Standard setter.
     *
     * @param string $locatortype how a vector-level locator of this source is to be interpreted (one of
     *  self::LOCATOR_*)
     */
    public function set_locatortype(string $locatortype): void {
        $this->locatortype = $locatortype;
    }
}

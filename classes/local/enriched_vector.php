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
 * Value object representing an embedding vector enriched with its associated metadata.
 *
 * This object is used in both directions:
 * - When storing, callers create an enriched vector and hand it to
 *   {@see \local_ai_manager\base_vecstore::insert_embeddings()}. Each vecstore subplugin extracts the required
 *   information via the getters and builds the actual store call for its backend (including generating the backend
 *   record id internally).
 * - When retrieving, each vecstore subplugin wraps its raw search response into enriched vector objects so that
 *   consumers can rely on a uniform data structure regardless of the underlying backend.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class enriched_vector {
    /** @var string The (string representation of the) embedding vector. */
    private string $vector = '';

    /** @var string The textual content associated with the vector. */
    private string $content = '';

    /** @var int The local_ai_content_sources record ID this vector belongs to. */
    private int $sourceid = 0;

    /** @var int The index of this chunk within the content it belongs to. */
    private int $chunk = 0;

    /** @var int The total number of chunks the content has been split into. */
    private int $maxchunks = 0;

    /**
     * Private constructor to enforce creation via {@see self::create()}.
     */
    private function __construct() {
    }

    /**
     * Creates a new enriched vector object.
     *
     * @param string $vector the (string representation of the) embedding vector
     * @param string $content the textual content associated with the vector
     * @param int $sourceid the local_ai_content_sources record ID this vector belongs to
     * @param int $chunk the index of this chunk within the content it belongs to
     * @param int $maxchunks the total number of chunks the content has been split into
     * @return self the created enriched vector object
     */
    public static function create(
        string $vector,
        string $content,
        int $sourceid,
        int $chunk,
        int $maxchunks
    ): self {
        $enrichedvector = new self();
        $enrichedvector->set_vector($vector);
        $enrichedvector->set_content($content);
        $enrichedvector->set_sourceid($sourceid);
        $enrichedvector->set_chunk($chunk);
        $enrichedvector->set_maxchunks($maxchunks);
        return $enrichedvector;
    }

    /**
     * Standard getter.
     *
     * @return string the (string representation of the) embedding vector
     */
    public function get_vector(): string {
        return $this->vector;
    }

    /**
     * Standard setter.
     *
     * @param string $vector the (string representation of the) embedding vector
     */
    public function set_vector(string $vector): void {
        $this->vector = $vector;
    }

    /**
     * Standard getter.
     *
     * @return string the textual content associated with the vector
     */
    public function get_content(): string {
        return $this->content;
    }

    /**
     * Standard setter.
     *
     * @param string $content the textual content associated with the vector
     */
    public function set_content(string $content): void {
        $this->content = $content;
    }

    /**
     * Standard getter.
     *
     * @return int the local_ai_content_sources record ID this vector belongs to
     */
    public function get_sourceid(): int {
        return $this->sourceid;
    }

    /**
     * Standard setter.
     *
     * @param int $sourceid the local_ai_content_sources record ID this vector belongs to
     */
    public function set_sourceid(int $sourceid): void {
        $this->sourceid = $sourceid;
    }

    /**
     * Standard getter.
     *
     * @return int the index of this chunk within the content it belongs to
     */
    public function get_chunk(): int {
        return $this->chunk;
    }

    /**
     * Standard setter.
     *
     * @param int $chunk the index of this chunk within the content it belongs to
     */
    public function set_chunk(int $chunk): void {
        $this->chunk = $chunk;
    }

    /**
     * Standard getter.
     *
     * @return int the total number of chunks the content has been split into
     */
    public function get_maxchunks(): int {
        return $this->maxchunks;
    }

    /**
     * Standard setter.
     *
     * @param int $maxchunks the total number of chunks the content has been split into
     */
    public function set_maxchunks(int $maxchunks): void {
        $this->maxchunks = $maxchunks;
    }
}

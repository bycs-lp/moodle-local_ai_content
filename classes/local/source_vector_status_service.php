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
use local_ai_manager\local\connector_factory;
use local_ai_manager\local\vecstore_factory;

/**
 * Service resolving vector-store status for a source.
 *
 * @package    local_ai_content
 * @copyright  2026 ISB Bayern
 * @author     Philipp Memmel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class source_vector_status_service {
    /**
     * Constructor.
     */
    public function __construct(
        /** @var source_management_access Access service for source management checks. */
        private readonly source_management_access $sourceaccess,
        /** @var connector_factory Connector factory for primary vecstore resolution. */
        private readonly connector_factory $connectorfactory,
        /** @var vecstore_factory Vecstore factory for source-specific vecstore resolution. */
        private readonly vecstore_factory $vecstorefactory,
    ) {
    }

    /**
     * Build vector-status payload for one source.
     *
     * @param int $sourceid Source id.
     * @return array
     */
    public function get_source_vector_status_payload(int $sourceid): array {
        $source = $this->load_indexable_source($sourceid);
        $this->sourceaccess->require_manage_access_for_source($source);

        $vecstore = $this->get_vecstore_for_source($source);
        if ($vecstore === null) {
            return $this->build_source_vector_status_payload(
                $source,
                false,
                false,
                'unreachable',
                'Es ist kein Vektorstore konfiguriert.',
            );
        }

        $response = $vecstore->get_all();
        if ($response->get_code() !== 200) {
            $message = trim($response->get_errormessage());
            if ($message === '') {
                $message = 'Verbindung zum Vektorstore fehlgeschlagen.';
            }
            return $this->build_source_vector_status_payload($source, false, false, 'unreachable', $message);
        }

        $matches = $response->get_queryresponse()?->get_matches() ?? [];
        $hasentries = false;
        foreach ($matches as $match) {
            if ($match->get_sourceid() === (int) $source->get_id()) {
                $hasentries = true;
                break;
            }
        }

        if (
            !$hasentries
            && !in_array($source->get_indexstatus(), [source::INDEXSTATUS_QUEUED, source::INDEXSTATUS_RUNNING], true)
        ) {
            $this->reset_source_index_state($source);
        }

        return $this->build_source_vector_status_payload(
            $source,
            true,
            $hasentries,
            $hasentries ? 'ok' : 'empty',
        );
    }

    /**
     * Resolve one source by id and ensure it supports vector-status checks.
     *
     * @param int $sourceid Source id.
     * @return source
     */
    protected function load_indexable_source(int $sourceid): source {
        if ($sourceid <= 0) {
            throw new \invalid_parameter_exception('Invalid source id.');
        }

        $source = source::get_record(['id' => $sourceid]);
        if ($source === null) {
            throw new \invalid_parameter_exception('Source not found.');
        }
        if (!in_array($source->get_sourcetype(), [source::TYPE_MODULE, source::TYPE_DOCUMENT], true)) {
            throw new \invalid_parameter_exception('Unsupported source type for vector status check.');
        }

        return $source;
    }

    /**
     * Reset stale indexed state when vectors are missing.
     *
     * @param source $source Source to reset.
     */
    protected function reset_source_index_state(source $source): void {
        $source->set_allowindex(false);
        $source->set_indexstatus(source::INDEXSTATUS_IDLE);
        $source->set_indextaskid(null);
        $source->set_lastindexed(0);
        $source->store();
    }

    /**
     * Build API payload for one vector-status check.
     *
     * @param source $source Source record.
     * @param bool $connected Whether the vecstore is reachable.
     * @param bool $hasentries Whether vectors exist for this source id.
     * @param string $status Status key.
     * @param string $message Optional status detail.
     * @return array
     */
    protected function build_source_vector_status_payload(
        source $source,
        bool $connected,
        bool $hasentries,
        string $status,
        string $message = '',
    ): array {
        return [
            'sourceId' => $source->get_id(),
            'connected' => $connected,
            'hasEntries' => $hasentries,
            'status' => $status,
            'message' => $message,
            'allowIndex' => $source->get_allowindex(),
            'indexStatus' => $source->get_indexstatus(),
            'indexStatusLabel' => get_string('indexingstatus_' . $source->get_indexstatus(), 'local_ai_content'),
            'lastIndexedAt' => $this->format_timestamp($source->get_lastindexed()),
        ];
    }

    /**
     * Resolve vector store for one source.
     *
     * @param source $source Source record.
     * @return ?\local_ai_manager\base_vecstore
     */
    protected function get_vecstore_for_source(source $source): ?\local_ai_manager\base_vecstore {
        $vecstoreid = $source->get_vecstoreid();
        if ($vecstoreid) {
            if ($this->vecstorefactory->instance_exists($vecstoreid)) {
                return $this->vecstorefactory->get_vecstore_by_id($vecstoreid);
            }
        }

        return $this->connectorfactory->get_primary_vecstore();
    }

    /**
     * Convert timestamp values to ISO-8601, null when not available.
     *
     * @param int $timestamp Unix timestamp.
     * @return ?string
     */
    protected function format_timestamp(int $timestamp): ?string {
        if ($timestamp <= 0) {
            return null;
        }

        return gmdate('c', $timestamp);
    }
}

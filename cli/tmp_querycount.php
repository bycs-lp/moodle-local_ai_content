<?php
// Temporary profiling script, will be deleted again.

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');

global $DB;

if (empty($argv[1])) {
    foreach ($DB->get_records('local_ai_content_sources', null, 'id',
            'id, contextid, sourcetype, name, cmid, allowindex, indexstatus, indextaskid, usermodified') as $r) {
        echo json_encode($r) . "\n";
    }
    exit(0);
}

$sourceid = (int) $argv[1];
$userid = (int) ($argv[2] ?? get_admin()->id);
\core\cron::setup_user(\core_user::get_user($userid));

$source = \local_ai_content\source::get_record(['id' => $sourceid]);
\core\di::get(\local_ai_content\local\index_service::class)->stop($source);
\core\di::get(\local_ai_content\local\index_service::class)->start($source);
$source = \local_ai_content\source::get_record(['id' => $sourceid]);
$record = $DB->get_record('task_adhoc', ['id' => $source->get_indextaskid()]);
$task = \core\task\manager::adhoc_task_from_record($record);

$before = $DB->perf_get_queries();
$counts = [];
$state = ['rest' => '', 'inparams' => false, 'sql' => ''];
$flushsql = function() use (&$counts, &$state): void {
    $sql = trim(preg_replace('/\s+/', ' ', $state['sql']));
    if ($sql !== '') {
        $counts[$sql] = ($counts[$sql] ?? 0) + 1;
    }
    $state['sql'] = '';
};
$handler = function(string $buffer) use (&$state, $flushsql): string {
    $lines = explode("\n", $state['rest'] . $buffer);
    $state['rest'] = array_pop($lines);
    foreach ($lines as $line) {
        if ($state['inparams']) {
            if ($line === ')]') {
                $state['inparams'] = false;
            }
            continue;
        }
        if ($line === '--------------------------------') {
            $flushsql();
            continue;
        }
        if (str_starts_with($line, '[array (')) {
            $flushsql();
            $state['inparams'] = true;
            continue;
        }
        if (str_starts_with($line, 'Query took')) {
            continue;
        }
        $state['sql'] .= $line . "\n";
    }
    return '';
};
$DB->set_debug(true);
ob_start($handler, 65536);
$task->execute();
ob_end_flush();
$flushsql();
$DB->set_debug(false);
$total = $DB->perf_get_queries() - $before;
$DB->delete_records('task_adhoc', ['id' => $record->id]);

arsort($counts);
$source = \local_ai_content\source::get_record(['id' => $sourceid]);
echo "Status: " . $source->get_indexstatus() . " " . $source->get_indexerror() . "\n";
echo "Total queries: {$total}\n";
foreach (array_slice($counts, 0, 40, true) as $sql => $count) {
    echo str_pad((string) $count, 7, ' ', STR_PAD_LEFT) . '  ' . substr($sql, 0, 250) . "\n";
}

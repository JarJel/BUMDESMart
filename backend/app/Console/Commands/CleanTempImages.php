<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CleanTempImages extends Command
{
    protected $signature   = 'images:clean-temp {--hours=24 : Delete temp files older than N hours}';
    protected $description = 'Remove orphaned temp files left by failed image conversion jobs';

    public function handle(): void
    {
        $hours   = (int) $this->option('hours');
        $tempDir = storage_path('app/temp');

        if (!is_dir($tempDir)) {
            $this->info('Temp directory does not exist, nothing to clean.');
            return;
        }

        $cutoff  = now()->subHours($hours)->timestamp;
        $deleted = 0;

        foreach (glob($tempDir . '/*') as $file) {
            if (is_file($file) && filemtime($file) < $cutoff) {
                @unlink($file);
                $deleted++;
            }
        }

        $this->info("Cleaned {$deleted} orphaned temp file(s) older than {$hours}h.");
    }
}

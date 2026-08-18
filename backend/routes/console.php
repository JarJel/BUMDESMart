<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Hapus temp file gambar yang sudah lebih dari 24 jam (jaga-jaga job gagal)
Schedule::command('images:clean-temp')->daily();

<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('whatsapp:process-queue')->everyMinute();

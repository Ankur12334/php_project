<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['status' => 'ok', 'service' => 'RoomFinder API']);
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

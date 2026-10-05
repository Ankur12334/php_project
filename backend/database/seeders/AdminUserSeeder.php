<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->updateOrInsert(
            ['email' => 'admin@roomfinder.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@roomfinder.com',
                'phone' => '+10000000000',
                'role' => 'admin',
                'is_verified' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}

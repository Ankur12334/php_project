<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->nullable()->unique();
                $table->string('phone')->nullable()->unique();
                $table->enum('role', ['user', 'admin'])->default('user');
                $table->string('google_id')->nullable();
                $table->boolean('is_verified')->default(false);
                $table->string('password_hash')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('rooms')) {
            Schema::create('rooms', function (Blueprint $table) {
                $table->id();
                $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
                $table->string('title');
                $table->text('description');
                $table->decimal('price', 10, 2);
                $table->enum('pricing_type', ['night', 'month'])->default('night');
                $table->string('city');
                $table->string('state');
                $table->string('pincode');
                $table->json('amenities');
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->timestamps();

                $table->index('city');
                $table->index('state');
                $table->index('price');
                $table->index('status');
            });
        }

        if (!Schema::hasTable('room_images')) {
            Schema::create('room_images', function (Blueprint $table) {
                $table->id();
                $table->foreignId('room_id')->constrained('rooms')->onDelete('cascade');
                $table->string('image_url', 500);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('bookings')) {
            Schema::create('bookings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('room_id')->constrained('rooms')->onDelete('cascade');
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->text('message')->nullable();
                $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');
                $table->timestamps();

                $table->index(['room_id', 'start_date', 'end_date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('room_images');
        Schema::dropIfExists('rooms');
        Schema::dropIfExists('users');
    }
};

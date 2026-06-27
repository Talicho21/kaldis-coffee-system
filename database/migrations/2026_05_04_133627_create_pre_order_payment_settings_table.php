<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pre_order_payment_settings', function (Blueprint $table) {
            $table->id();
            $table->string('payment_method')->unique();
            $table->string('validation_pattern')->nullable();
            $table->string('example')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default values
        DB::table('pre_order_payment_settings')->insert([
            ['payment_method' => 'Tele Birr', 'validation_pattern' => '^\d{10,15}$', 'example' => '12345678901', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['payment_method' => 'CBE', 'validation_pattern' => '^(FT|ET)\d{8,12}$', 'example' => 'FT2412345678', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['payment_method' => 'RTGS', 'validation_pattern' => null, 'example' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pre_order_payment_settings');
    }
};

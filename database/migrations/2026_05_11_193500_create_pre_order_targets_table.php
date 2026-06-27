<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pre_order_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('holiday_id')->constrained('holidays')->cascadeOnDelete();
            $table->foreignId('order_type_id')->nullable()->constrained('order_types')->nullOnDelete();
            $table->unsignedInteger('target_count');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // A holiday can only have one target per order type (null = overall target)
            $table->unique(['holiday_id', 'order_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pre_order_targets');
    }
};

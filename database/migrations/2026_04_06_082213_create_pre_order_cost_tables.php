<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pre_order_cost_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('pre_order_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('pre_order_cost_categories')->onDelete('cascade');
            $table->foreignId('holiday_id')->constrained('holidays')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->date('date');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pre_order_costs');
        Schema::dropIfExists('pre_order_cost_categories');
    }
};

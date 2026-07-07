<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('expense_budget_activity_logs')) {
            return;
        }

        Schema::create('expense_budget_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expense_budget_id')->constrained('expense_budgets')->cascadeOnDelete();
            $table->foreignId('expense_budget_item_id')->nullable()->constrained('expense_budget_items')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 120);
            $table->string('summary', 500);
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['expense_budget_id', 'created_at'], 'eb_activity_logs_budget_created_idx');
            $table->index(['expense_budget_item_id', 'created_at'], 'eb_activity_logs_item_created_idx');
            $table->index(['user_id', 'created_at'], 'eb_activity_logs_user_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_budget_activity_logs');
    }
};

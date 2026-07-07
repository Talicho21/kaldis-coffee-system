<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expense_budget_items', function (Blueprint $table) {
            $table->decimal('planned_budget', 12, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('expense_budget_items', function (Blueprint $table) {
            $table->decimal('planned_budget', 12, 2)->nullable(false)->default(0)->change();
        });
    }
};

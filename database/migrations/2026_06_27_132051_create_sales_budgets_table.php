<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')
                  ->constrained()
                  ->onDelete('cascade');
            $table->unsignedTinyInteger('ethiopian_month');
            $table->unsignedSmallInteger('ethiopian_year');
            $table->decimal('sales_amount', 15, 2)->default(0);
            $table->decimal('prev_expense_budget', 15, 2)->default(0);
            $table->foreignId('created_by')
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->foreignId('updated_by')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->timestamps();
            $table->unique([
                'branch_id',
                'ethiopian_month',
                'ethiopian_year'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_budgets');
    }
};
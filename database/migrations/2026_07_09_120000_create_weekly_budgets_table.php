<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weekly_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years')->cascadeOnDelete();
            $table->foreignId('fiscal_month_id')->constrained('fiscal_months')->cascadeOnDelete();
            $table->unsignedTinyInteger('week_number'); // 1–5, ISO week within the year
            $table->date('week_start_date');             // Monday of that week (Gregorian)
            $table->date('week_end_date');               // Sunday of that week (Gregorian)
            $table->enum('request_type', ['urgent', 'normal']);
            $table->enum('status_finance', ['pending', 'approved', 'rejected', 'paid'])->default('pending');
            $table->enum('status_ceo', ['pending', 'approved', 'rejected'])->default('pending');
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_budgets');
    }
};

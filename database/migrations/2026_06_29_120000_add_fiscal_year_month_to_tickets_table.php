<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('fiscal_year_id')->nullable()->after('beneficiary_department_id')->constrained('fiscal_years')->nullOnDelete();
            $table->foreignId('fiscal_month_id')->nullable()->after('fiscal_year_id')->constrained('fiscal_months')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['fiscal_year_id']);
            $table->dropForeign(['fiscal_month_id']);
            $table->dropColumn(['fiscal_year_id', 'fiscal_month_id']);
        });
    }
};

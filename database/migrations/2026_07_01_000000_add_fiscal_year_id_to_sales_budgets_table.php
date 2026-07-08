<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_budgets', function (Blueprint $table) {
            $table->foreignId('fiscal_year_id')
                ->nullable()
                ->after('ethiopian_year')
                ->constrained()
                ->onDelete('cascade');
        });

        DB::statement("UPDATE sales_budgets
            JOIN fiscal_years ON fiscal_years.name = CONCAT('EFY ', sales_budgets.ethiopian_year)
            SET sales_budgets.fiscal_year_id = fiscal_years.id");
    }

    public function down(): void
    {
        Schema::table('sales_budgets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('fiscal_year_id');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('expense_budgets', 'expense_code')) {
            return;
        }

        Schema::table('expense_budgets', function (Blueprint $table) {
            $table->dropForeign(['expense_code']);
            $table->dropColumn('expense_code');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('expense_budgets', 'expense_code')) {
            return;
        }

        Schema::table('expense_budgets', function (Blueprint $table) {
            $table->unsignedInteger('expense_code')->nullable()->after('department_id');

            $table->foreign('expense_code')
                ->references('code')
                ->on('expenses')
                ->nullOnDelete();
        });
    }
};

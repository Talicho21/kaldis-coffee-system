<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('expenses')) {
            return;
        }

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->boolean('frequent_expense')->default(false);
            $table->string('icon', 50)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('name');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('expenses')) {
            return;
        }

        if (Schema::hasColumn('expenses', 'expense_type')) {
            return;
        }

        Schema::dropIfExists('expenses');
    }
};

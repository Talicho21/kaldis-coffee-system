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
        Schema::table('pre_order_costs', function (Blueprint $table) {
            // Add product cost columns
            $table->foreignId('pre_order_product_id')->nullable()->after('category_id')->constrained('pre_order_products')->onDelete('cascade');
            $table->decimal('product_cost_per_unit', 12, 2)->nullable()->after('amount');
            
            // Add indexes for better performance
            $table->index(['holiday_id', 'pre_order_product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pre_order_costs', function (Blueprint $table) {
            $table->dropIndex(['holiday_id', 'pre_order_product_id']);
            $table->dropForeign(['pre_order_product_id']);
            $table->dropColumn(['pre_order_product_id', 'product_cost_per_unit']);
        });
    }
};

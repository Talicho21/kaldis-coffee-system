<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pre_orders', function (Blueprint $table) {
            $table->string('client_name')->after('order_number')->nullable();
        });

        // Concatenate first_name and last_name
        DB::table('pre_orders')->get()->each(function ($order) {
            DB::table('pre_orders')->where('id', $order->id)->update([
                'client_name' => trim($order->first_name . ' ' . ($order->last_name ?? '')),
            ]);
        });

        Schema::table('pre_orders', function (Blueprint $table) {
            $table->string('client_name')->nullable(false)->change();
            $table->dropColumn(['first_name', 'last_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pre_orders', function (Blueprint $table) {
            $table->string('first_name')->after('order_number')->nullable();
            $table->string('last_name')->after('first_name')->nullable();
        });

        DB::table('pre_orders')->get()->each(function ($order) {
            $parts = explode(' ', trim($order->client_name), 2);
            DB::table('pre_orders')->where('id', $order->id)->update([
                'first_name' => $parts[0],
                'last_name' => $parts[1] ?? null,
            ]);
        });

        Schema::table('pre_orders', function (Blueprint $table) {
            $table->dropColumn('client_name');
        });
    }
};

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
        Schema::create('pre_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('client_name');
            $table->string('phone_number');
            $table->foreignId('order_type_id')->constrained('order_types')->onDelete('cascade');
            $table->foreignId('collection_day_id')->constrained('collection_days')->onDelete('cascade');
            $table->foreignId('collection_branch_id')->constrained('branches')->onDelete('cascade');
            $table->enum('status', ['Pending', 'Paid', 'Collected', 'Cancelled'])->default('Pending');
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pre_orders');
    }
};

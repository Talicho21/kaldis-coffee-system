<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ensure the permission exists
        $permission = Permission::firstOrCreate(['name' => 'view pre-orders']);

        // Create Marketing role and assign permission
        $marketingRole = Role::firstOrCreate(['name' => 'Marketing']);
        $marketingRole->givePermissionTo($permission);

        // Create Production role and assign permission
        $productionRole = Role::firstOrCreate(['name' => 'Production']);
        $productionRole->givePermissionTo($permission);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketing_and_production_roles');
    }
};

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ExpenseBudgetPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $managePermission = Permission::updateOrCreate(
            ['name' => 'manage expense budgets', 'guard_name' => 'web'],
        );

        $viewPermission = Permission::updateOrCreate(
            ['name' => 'view expense budgets', 'guard_name' => 'web'],
        );

        $fullAccessRoles = [
            'Admin',
            'Super Admin',
            'Finance Manager',
            'Finance Director',
        ];

        $windowedManageRoles = [
            'Branch Manager',
            'Department Manager',
        ];

        foreach ($fullAccessRoles as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->givePermissionTo([$managePermission, $viewPermission]);
        }

        foreach ($windowedManageRoles as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->givePermissionTo([$managePermission, $viewPermission]);
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ExpenseBudgetPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = collect(['manage expense budgets', 'view expense budgets'])
            ->map(fn (string $name) => Permission::updateOrCreate(
                ['name' => $name, 'guard_name' => 'web']
            ));

        $roles = Role::whereIn('name', ['Admin', 'Super Admin'])->get();

        foreach ($roles as $role) {
            $role->givePermissionTo($permissions);
        }
    }
}

<?php

namespace App\Support;

use App\Models\User;
use Carbon\CarbonInterface;

class ExpenseBudgetAccess
{
    public static function canView(?User $user = null): bool
    {
        $user ??= auth()->user();

        return $user?->can('view expense budgets') ?? false;
    }

    public static function canManage(?User $user = null): bool
    {
        $user ??= auth()->user();

        if (! $user?->can('manage expense budgets')) {
            return false;
        }

        if (self::hasUnrestrictedManageAccess($user)) {
            return true;
        }

        return self::isWithinManageWindow();
    }

    public static function hasUnrestrictedManageAccess(User $user): bool
    {
        return $user->hasAnyRole(config('expense_budget.unrestricted_manage_roles', []));
    }

    public static function isWithinManageWindow(?CarbonInterface $date = null): bool
    {
        $date ??= now();
        $startDay = (int) config('expense_budget.manage_window.start_day', 5);
        $endDay = (int) config('expense_budget.manage_window.end_day', 12);
        $day = $date->day;

        return $day >= $startDay && $day <= $endDay;
    }

    public static function manageDeniedMessage(): string
    {
        $startDay = (int) config('expense_budget.manage_window.start_day', 5);
        $endDay = (int) config('expense_budget.manage_window.end_day', 12);

        return "Expense budgets can only be managed from the {$startDay}th to the {$endDay}th of each month.";
    }
}

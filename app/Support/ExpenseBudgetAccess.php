<?php

namespace App\Support;

use App\Models\Branch;
use App\Models\ExpenseBudget;
use App\Models\ExpenseBudgetItem;
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

    public static function canViewItemHistory(?User $user, ExpenseBudgetItem $item): bool
    {
        if (! self::canView($user)) {
            return false;
        }

        if (self::hasUnrestrictedViewAccess($user)) {
            return true;
        }

        $item->loadMissing(['expenseBudget.branch', 'expenseBudget.department']);
        $budget = $item->expenseBudget;

        if (! $budget) {
            return false;
        }

        return self::canViewBudgetHistory($user, $budget);
    }

    public static function canViewBudgetHistory(?User $user, ExpenseBudget $budget): bool
    {
        if (! $user || ! self::canView($user)) {
            return false;
        }

        if (self::hasUnrestrictedViewAccess($user)) {
            return true;
        }

        $budget->loadMissing('branch');

        if ($user->hasRole('Department Manager')) {
            if (! self::isHeadOfficeBranch($budget->branch) || ! $budget->department_id) {
                return false;
            }

            return $user->isManagerOfDepartment((int) $budget->department_id);
        }

        if ($user->hasRole('Branch Manager')) {
            if (self::isHeadOfficeBranch($budget->branch)) {
                return false;
            }

            $userBranchId = $user->employee?->branch_id;

            return $userBranchId && (int) $budget->branch_id === (int) $userBranchId;
        }

        return false;
    }

    public static function hasUnrestrictedManageAccess(User $user): bool
    {
        return $user->hasAnyRole(config('expense_budget.unrestricted_manage_roles', []));
    }

    public static function hasUnrestrictedViewAccess(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasAnyRole(config('expense_budget.unrestricted_view_roles', []));
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

    public static function viewHistoryDeniedMessage(): string
    {
        return 'You can only view activity history for your own branch or department.';
    }

    public static function isHeadOfficeBranch(?Branch $branch): bool
    {
        if (! $branch) {
            return false;
        }

        if (strcasecmp($branch->branch_code ?? '', 'HO') === 0) {
            return true;
        }

        return str_contains($branch->name, 'Head Office');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Department;
use App\Models\ExpenseBudget;
use App\Models\ExpenseBudgetItem;
use App\Models\ExpenseItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseBudgetController extends Controller
{
    public function index(): Response
    {
        abort_unless(auth()->user()->can('view expense budgets'), 403);

        $query = ExpenseBudgetItem::query()
            ->with([
                'expenseBudget.branch',
                'expenseBudget.department',
                'expenseBudget.creator',
                'expenseItem',
            ])
            ->whereNotNull('planned_budget')
            ->whereHas('expenseBudget');

        if ($search = request('search')) {
            $query->whereHas('expenseItem', function ($q) use ($search) {
                $q->where('expense_type', 'like', "%{$search}%");
            });
        }

        if ($branchId = request('branch_id')) {
            $query->whereHas('expenseBudget', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        if ($departmentId = request('department_id')) {
            $query->whereHas('expenseBudget', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        if ($month = request('month')) {
            $query->whereHas('expenseBudget', function ($q) use ($month) {
                $q->where('month', $month);
            });
        }

        if ($year = request('year')) {
            $query->whereHas('expenseBudget', function ($q) use ($year) {
                $q->where('year', $year);
            });
        }

        $branches = Branch::query()
            ->orderBy('name')
            ->get(['id', 'name', 'branch_code']);

        $departments = Department::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $years = ExpenseBudget::query()
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->values();

        $items = $query
            ->join('expense_budgets', function ($join) {
                $join->on('expense_budget_items.expense_budget_id', '=', 'expense_budgets.id')
                    ->whereNull('expense_budgets.deleted_at');
            })
            ->orderByDesc('expense_budgets.year')
            ->orderByDesc('expense_budgets.month')
            ->orderByDesc('expense_budget_items.created_at')
            ->select('expense_budget_items.*')
            ->paginate(5)
            ->withQueryString()
            ->through(fn (ExpenseBudgetItem $item) => [
                'id' => $item->id,
                'month' => $item->expenseBudget->month,
                'year' => $item->expenseBudget->year,
                'branch' => $item->expenseBudget->branch?->name,
                'department' => $item->expenseBudget->department?->name,
                'expense_item' => $item->expenseItem?->expense_type,
                'planned_budget' => $item->planned_budget,
                'actual_budget' => 0,
                'status' => $item->expenseBudget->status,
                'submitted_by' => $item->expenseBudget->creator?->name,
            ]);

        return Inertia::render('Budget/ExpenseBudget/Index', [
            'items' => $items,
            'branches' => $branches,
            'departments' => $departments,
            'years' => $years,
            'request' => request()->only(['search', 'branch_id', 'department_id', 'month', 'year']),
        ]);
    }

    public function create(): Response
    {
        abort_unless(auth()->user()->can('manage expense budgets'), 403);

        $branches = Branch::query()
            ->where(function ($query) {
                $query->where('status', 'active')
                    ->orWhere('name', 'like', '%Head Office%')
                    ->orWhereRaw('UPPER(branch_code) = ?', ['HO']);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'branch_code']);

        $departments = Department::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $mapExpenseItem = fn (ExpenseItem $item) => [
            'id' => $item->expense_parent_acc_code,
            'name' => $item->expense_type,
            'icon' => null,
        ];

        $frequentExpenseItems = ExpenseItem::query()
            ->where('frequent_expense', true)
            ->orderBy('expense_type')
            ->get()
            ->map($mapExpenseItem)
            ->values();

        $otherExpenseItems = ExpenseItem::query()
            ->where('frequent_expense', false)
            ->orderBy('expense_type')
            ->get()
            ->map($mapExpenseItem)
            ->values();

        return Inertia::render('Budget/ExpenseBudget/Create', [
            'branches' => $branches,
            'departments' => $departments,
            'frequentExpenseItems' => $frequentExpenseItems,
            'otherExpenseItems' => $otherExpenseItems,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->can('manage expense budgets'), 403);

        $validated = $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:1990', 'max:2100'],
            'branch_id' => ['required', 'exists:branches,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'items' => ['nullable', 'array'],
            'items.*.expense_item_id' => ['required', 'exists:expenses,expense_parent_acc_code'],
            'items.*.planned_budget' => ['nullable', 'numeric', 'min:0'],
            'items.*.prev_month_budget' => ['nullable', 'numeric', 'min:0'],
        ]);

        $branch = Branch::findOrFail($validated['branch_id']);
        $isHeadOffice = $this->isHeadOfficeBranch($branch);

        if ($isHeadOffice && empty($validated['department_id'])) {
            throw ValidationException::withMessages([
                'department_id' => 'The department field is required when the selected branch is Head Office.',
            ]);
        }

        if (! $isHeadOffice) {
            $validated['department_id'] = null;
        }

        $itemsToSave = collect($validated['items'] ?? [])
            ->filter(function (array $item) {
                return filled($item['expense_item_id'])
                    && array_key_exists('planned_budget', $item)
                    && $item['planned_budget'] !== null
                    && $item['planned_budget'] !== '';
            })
            ->values()
            ->all();

        $budgetedItemIds = ExpenseBudgetItem::query()
            ->whereNotNull('planned_budget')
            ->whereHas('expenseBudget', function ($query) use ($validated, $isHeadOffice) {
                $departmentId = $isHeadOffice ? ($validated['department_id'] ?? null) : null;

                $query
                    ->where('month', $validated['month'])
                    ->where('year', $validated['year'])
                    ->where('branch_id', $validated['branch_id'])
                    ->when(
                        $departmentId,
                        fn ($q) => $q->where('department_id', $departmentId),
                        fn ($q) => $q->whereNull('department_id')
                    );
            })
            ->pluck('expense_item_id')
            ->all();

        foreach ($itemsToSave as $index => $item) {
            if (in_array($item['expense_item_id'], $budgetedItemIds, true)) {
                throw ValidationException::withMessages([
                    "items.{$index}.expense_item_id" => 'A planned budget has already been set for this expense item.',
                ]);
            }
        }

        if (empty($itemsToSave)) {
            throw ValidationException::withMessages([
                'items' => 'At least one expense item with a planned budget is required.',
            ]);
        }

        $newBudgetAmount = collect($itemsToSave)->sum(fn (array $item) => (float) $item['planned_budget']);

        DB::transaction(function () use ($validated, $itemsToSave, $newBudgetAmount) {
            $budget = $this->findExpenseBudgetForScope(
                (int) $validated['month'],
                (int) $validated['year'],
                (int) $validated['branch_id'],
                $validated['department_id'] ? (int) $validated['department_id'] : null,
            );

            if ($budget) {
                $budget->update([
                    'budget_amount' => (float) $budget->budget_amount + $newBudgetAmount,
                ]);
            } else {
                $budget = ExpenseBudget::create([
                    'month' => $validated['month'],
                    'year' => $validated['year'],
                    'branch_id' => $validated['branch_id'],
                    'department_id' => $validated['department_id'],
                    'budget_amount' => $newBudgetAmount,
                    'created_by' => auth()->id(),
                    'status' => 'draft',
                ]);
            }

            foreach ($itemsToSave as $item) {
                ExpenseBudgetItem::create([
                    'expense_budget_id' => $budget->id,
                    'expense_item_id' => $item['expense_item_id'],
                    'prev_month_budget' => $item['prev_month_budget'] ?? null,
                    'planned_budget' => $item['planned_budget'],
                ]);
            }
        });

        return redirect()
            ->route('expense-budget.create')
            ->with('message', 'Expense budget saved successfully.');
    }

    public function destroyItem(ExpenseBudgetItem $expenseBudgetItem): RedirectResponse
    {
        abort_unless(auth()->user()->can('manage expense budgets'), 403);

        DB::transaction(function () use ($expenseBudgetItem) {
            $budget = $expenseBudgetItem->expenseBudget;

            if ($budget) {
                $budget->update([
                    'budget_amount' => max(0, (float) $budget->budget_amount - (float) $expenseBudgetItem->planned_budget),
                ]);

                $expenseBudgetItem->delete();

                if ($budget->items()->count() === 0) {
                    $budget->delete();
                }
            } else {
                $expenseBudgetItem->delete();
            }
        });

        return redirect()
            ->route('expense-budget.index')
            ->with('message', 'Expense budget item deleted successfully.');
    }

    public function getPrevBudget(Request $request): JsonResponse
    {
        abort_unless(auth()->user()->can('manage expense budgets'), 403);

        $validated = $request->validate([
            'expense_item_id' => ['required', 'exists:expenses,expense_parent_acc_code'],
            'branch_id' => ['required', 'exists:branches,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:1990', 'max:2100'],
        ]);

        $branch = Branch::findOrFail($validated['branch_id']);
        $departmentId = $this->isHeadOfficeBranch($branch)
            ? ($validated['department_id'] ?? null)
            : null;

        [$prevMonth, $prevYear] = $this->previousMonthYear(
            (int) $validated['month'],
            (int) $validated['year']
        );

        $prevBudgetItem = ExpenseBudgetItem::query()
            ->where('expense_item_id', $validated['expense_item_id'])
            ->whereHas('expenseBudget', function ($query) use ($validated, $departmentId, $prevMonth, $prevYear) {
                $query
                    ->where('month', $prevMonth)
                    ->where('year', $prevYear)
                    ->where('branch_id', $validated['branch_id'])
                    ->when(
                        $departmentId,
                        fn ($q) => $q->where('department_id', $departmentId),
                        fn ($q) => $q->whereNull('department_id')
                    );
            })
            ->first();

        return response()->json([
            'prev_month_budget' => $prevBudgetItem?->planned_budget,
        ]);
    }

    public function getBudgetedExpenseItems(Request $request): JsonResponse
    {
        abort_unless(auth()->user()->can('manage expense budgets'), 403);

        $validated = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:1990', 'max:2100'],
        ]);

        $branch = Branch::findOrFail($validated['branch_id']);
        $departmentId = $this->isHeadOfficeBranch($branch)
            ? ($validated['department_id'] ?? null)
            : null;

        $expenseItemIds = ExpenseBudgetItem::query()
            ->whereNotNull('planned_budget')
            ->whereHas('expenseBudget', function ($query) use ($validated, $departmentId) {
                $query
                    ->where('month', $validated['month'])
                    ->where('year', $validated['year'])
                    ->where('branch_id', $validated['branch_id'])
                    ->when(
                        $departmentId,
                        fn ($q) => $q->where('department_id', $departmentId),
                        fn ($q) => $q->whereNull('department_id')
                    );
            })
            ->pluck('expense_item_id')
            ->unique()
            ->values();

        return response()->json([
            'expense_item_ids' => $expenseItemIds,
        ]);
    }

    private function findExpenseBudgetForScope(
        int $month,
        int $year,
        int $branchId,
        ?int $departmentId,
    ): ?ExpenseBudget {
        return ExpenseBudget::query()
            ->where('month', $month)
            ->where('year', $year)
            ->where('branch_id', $branchId)
            ->when(
                $departmentId,
                fn ($query) => $query->where('department_id', $departmentId),
                fn ($query) => $query->whereNull('department_id'),
            )
            ->first();
    }

    private function isHeadOfficeBranch(Branch $branch): bool
    {
        if (strcasecmp($branch->branch_code ?? '', 'HO') === 0) {
            return true;
        }

        return str_contains($branch->name, 'Head Office');
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function previousMonthYear(int $month, int $year): array
    {
        if ($month === 1) {
            return [12, $year - 1];
        }

        return [$month - 1, $year];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ChildCategory;
use App\Models\FiscalYear;
use App\Models\InventoryCompletionStatus;
use App\Models\InventoryCount;
use App\Models\InventoryPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class InventoryCompletionTrackingController extends Controller
{
    /**
     * API endpoint for backward compatibility - returns JSON
     */
    public function apiIndex(Request $request): JsonResponse
    {
        $query = InventoryPeriod::query();

        if ($request->filled('inventory_period_id')) {
            $query->where('id', $request->inventory_period_id);
        }

        if ($request->filled('fiscal_year_id')) {
            $query->where('fiscal_year_id', $request->fiscal_year_id);
        }

        $inventoryPeriods = $query->with('fiscalYear:id,name')->get();
        $branches = Branch::whereNotIn('name', ['Production', 'Head Office', 'Production 2'])
            ->whereNotIn('id', [3, 5, 48])
            ->get();
        $totalChildCategories = ChildCategory::count();

        $statusFilter = $request->query('status');

        $completionData = $this->calculateCompletionData($branches, $inventoryPeriods, $totalChildCategories);

        if ($statusFilter && in_array($statusFilter, ['not_started', 'in_progress', 'completed'])) {
            $completionData = $completionData->filter(function ($branch) use ($statusFilter) {
                return $branch['periods']->contains('status', $statusFilter);
            })->values();
        }

        return response()->json([
            'data' => $completionData,
        ]);
    }

    /**
     * Inertia page for viewing completion tracking
     */
    public function index(Request $request): Response
    {
        // Cache inventory periods for 10 minutes
        $allInventoryPeriods = Cache::remember('inventory_periods_all', 600, fn() => 
            InventoryPeriod::orderByDesc('id')->get(['id', 'inventory_period_name', 'fiscal_year_id', 'status'])
        );
        
        // Cache fiscal years for 10 minutes
        $fiscalYears = Cache::remember('fiscal_years_all', 600, fn() => 
            FiscalYear::orderByDesc('id')->get(['id', 'name'])
        );
        
        // Default to latest period if not specified
        $periodId = $request->query('inventory_period_id');
        if ($periodId === null || $periodId === '') {
            $periodId = $allInventoryPeriods->first()?->id;
        } elseif ($periodId === 'all') {
            $periodId = null;
        }
        
        // Build query for filtered periods to calculate completion
        $query = InventoryPeriod::query();

        if ($periodId) {
            $query->where('id', $periodId);
        }

        if ($request->filled('fiscal_year_id')) {
            $query->where('fiscal_year_id', $request->fiscal_year_id);
        }

        $inventoryPeriods = $query->get();
        
        // Cache branches for 10 minutes
        $branches = Cache::remember('branches_inventory_tracking', 600, fn() => 
            Branch::whereNotIn('name', ['Production', 'Head Office', 'Production 2'])
                ->whereNotIn('id', [3, 5, 48])
                ->get()
        );
        
        // Cache total child categories count for 10 minutes
        $totalChildCategories = Cache::remember('child_categories_count', 600, fn() => 
            ChildCategory::count()
        );

        $statusFilter = $request->query('status');

        $completionData = $this->calculateCompletionData($branches, $inventoryPeriods, $totalChildCategories);

        // Convert completionData to proper array structure
        $completionDataArray = $completionData->map(function ($branch) {
            return [
                'branch_id' => $branch['branch_id'],
                'branch_name' => $branch['branch_name'],
                'periods' => collect($branch['periods'])->values()->toArray(),
            ];
        })->values()->toArray();

        // Apply status filter
        if ($statusFilter && in_array($statusFilter, ['not_started', 'in_progress', 'completed'])) {
            $completionDataArray = array_filter($completionDataArray, function ($branch) use ($statusFilter) {
                return collect($branch['periods'])->contains('status', $statusFilter);
            });
            $completionDataArray = array_values($completionDataArray);
        }

        return Inertia::render('inventory-completion-tracking/index', [
            'completionData' => $completionDataArray,
            'inventoryPeriods' => $allInventoryPeriods->toArray(),
            'fiscalYears' => $fiscalYears->toArray(),
            'filters' => [
                'inventory_period_id' => $periodId ? (string) $periodId : null,
                'fiscal_year_id' => $request->query('fiscal_year_id'),
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Shared logic for calculating completion data
     */
    private function calculateCompletionData($branches, $inventoryPeriods, $totalChildCategories)
    {
        return $branches->map(function ($branch) use ($inventoryPeriods, $totalChildCategories) {
            $periods = $inventoryPeriods->map(function ($period) use ($branch, $totalChildCategories) {
                // Count distinct child categories that have at least one count
                $countedChildCategories = InventoryCount::where('branch_id', $branch->id)
                    ->where('inventory_period_id', $period->id)
                    ->distinct('child_category_id')
                    ->count('child_category_id');

                // Check if there are any counts for this branch/period
                $hasCounts = $countedChildCategories > 0;

                // Check if all counts are approved
                $totalCounts = InventoryCount::where('branch_id', $branch->id)
                    ->where('inventory_period_id', $period->id)
                    ->count();

                $approvedCounts = InventoryCount::where('branch_id', $branch->id)
                    ->where('inventory_period_id', $period->id)
                    ->where('is_approved', true)
                    ->count();

                $allCountsApproved = $totalCounts > 0 && $totalCounts === $approvedCounts;

                // Get existing completion status
                $completionStatus = InventoryCompletionStatus::where('branch_id', $branch->id)
                    ->where('inventory_period_id', $period->id)
                    ->first();

                // Determine status based on counts and approvals
                if ($allCountsApproved) {
                    $status = 'completed';
                    // Auto-update to completed if all counts are approved
                    if (!$completionStatus) {
                        InventoryCompletionStatus::create([
                            'branch_id' => $branch->id,
                            'inventory_period_id' => $period->id,
                            'status' => 'completed',
                            'approved_by' => auth()->id(),
                            'approved_at' => now(),
                        ]);
                    } elseif ($completionStatus->status !== 'completed') {
                        $completionStatus->update([
                            'status' => 'completed',
                            'approved_by' => auth()->id(),
                            'approved_at' => now(),
                        ]);
                    }
                } elseif ($hasCounts) {
                    $status = 'in_progress';
                    if (!$completionStatus) {
                        InventoryCompletionStatus::create([
                            'branch_id' => $branch->id,
                            'inventory_period_id' => $period->id,
                            'status' => 'in_progress',
                        ]);
                    } elseif ($completionStatus->status === 'not_started') {
                        $completionStatus->update(['status' => 'in_progress']);
                    } elseif ($completionStatus->status === 'completed') {
                        // If previously completed but now has unapproved counts, revert to in_progress
                        $completionStatus->update([
                            'status' => 'in_progress',
                            'approved_by' => null,
                            'approved_at' => null,
                        ]);
                    }
                } else {
                    $status = 'not_started';
                    if (!$completionStatus) {
                        InventoryCompletionStatus::create([
                            'branch_id' => $branch->id,
                            'inventory_period_id' => $period->id,
                            'status' => 'not_started',
                        ]);
                    }
                }

                return [
                    'inventory_period_id' => $period->id,
                    'inventory_period_name' => $period->inventory_period_name,
                    'counted_child_categories' => $countedChildCategories,
                    'total_child_categories' => $totalChildCategories,
                    'status' => $status,
                ];
            });

            return [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'periods' => $periods,
            ];
        });
    }

    public function getMissingChildCategories(Request $request, int $branchId, int $periodId): JsonResponse
    {
        $allChildCategories = ChildCategory::orderBy('child_name')->get(['id', 'child_name']);
        
        $countedChildCategoryIds = InventoryCount::where('branch_id', $branchId)
            ->where('inventory_period_id', $periodId)
            ->distinct('child_category_id')
            ->pluck('child_category_id');

        $missingChildCategories = $allChildCategories->filter(function ($category) use ($countedChildCategoryIds) {
            return !$countedChildCategoryIds->contains($category->id);
        })->values();

        return response()->json([
            'missing_child_categories' => $missingChildCategories,
            'total_missing' => $missingChildCategories->count(),
        ]);
    }

    public function updateStatus(Request $request, int $branchId, int $periodId): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:not_started,in_progress,completed'],
        ]);

        $completionStatus = InventoryCompletionStatus::where('branch_id', $branchId)
            ->where('inventory_period_id', $periodId)
            ->firstOrFail();

        $updateData = ['status' => $validated['status']];

        if ($validated['status'] === 'completed') {
            $updateData['approved_by'] = auth()->id();
            $updateData['approved_at'] = now();
        } else {
            $updateData['approved_by'] = null;
            $updateData['approved_at'] = null;
        }

        $completionStatus->update($updateData);

        return back()->with('success', 'Status updated successfully.');
    }
}

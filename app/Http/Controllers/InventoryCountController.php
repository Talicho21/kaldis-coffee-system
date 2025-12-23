<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ChildCategory;
use App\Models\InventoryCount;
use App\Models\InventoryPeriod;
use App\Models\Product;
use App\Rules\ValidateInventoryCount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class InventoryCountController extends Controller
{
    /**
     * Display a paginated listing of the inventory counts.
     */
    public function index(Request $request): Response
    {
        // Get the logged-in user's branch ID
        $user = auth()->user();
        $userBranchId = $user->employee?->branch_id;
        $canManageAllBranches = $user->can('manage all branches inventory');

        $query = InventoryCount::query()
            ->with([
                'branch:id,name',
                'inventoryPeriod:id,inventory_period_name,status',
                'childCategory:id,child_name',
                'product:id,product_name',
                'creator:id,name',
                'updater:id,name',
                'approver:id,name',
            ]);

        // Filter by user's branch unless they have permission to manage all branches
        if (!$canManageAllBranches && $userBranchId) {
            $query->where('branch_id', $userBranchId);
        }

        // Allow branch filtering if user can manage all branches
        if ($canManageAllBranches && $branchId = $request->query('branch_id')) {
            $query->where('branch_id', $branchId);
        }

        // Cache inventory periods
        $inventoryPeriods = Cache::remember('inventory_periods_all', 600, fn() => 
            InventoryPeriod::orderByDesc('id')->get(['id', 'inventory_period_name', 'status'])
        );

        // Default to latest period if not specified
        $periodId = $request->query('inventory_period_id');
        if ($periodId === null || $periodId === '') {
            $periodId = $inventoryPeriods->first()?->id;
        } elseif ($periodId === 'all') {
            $periodId = null;
        }

        // Filter by inventory period
        if ($periodId) {
            $query->where('inventory_period_id', $periodId);
        }

        // Filter by approval status
        if ($request->filled('approval_status')) {
            $approvalStatus = $request->query('approval_status');
            if ($approvalStatus === 'approved') {
                $query->where('is_approved', true);
            } elseif ($approvalStatus === 'pending') {
                $query->where('is_approved', false);
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($subQuery) use ($search) {
                $subQuery->whereHas('product', function ($q) use ($search) {
                    $q->where('product_name', 'like', "%{$search}%");
                })
                ->orWhereHas('childCategory', function ($q) use ($search) {
                    $q->where('child_name', 'like', "%{$search}%");
                })
                ->orWhereHas('branch', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('creator', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('approver', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            });
        }

        if ($childCategoryId = $request->query('child_category_id')) {
            $query->where('child_category_id', $childCategoryId);
        }

        if ($productId = $request->query('product_id')) {
            $query->where('product_id', $productId);
        }

        $perPage = (int) $request->query('per_page', 15);
        $perPage = $perPage > 0 ? $perPage : 15;

        $inventoryCounts = $query->orderByDesc('id')->paginate($perPage)->withQueryString();

        // Cache dropdown data for 10 minutes
        $branches = $canManageAllBranches 
            ? Cache::remember('branches_all', 600, fn() => Branch::all(['id', 'name']))
            : [];
        
        $childCategories = Cache::remember('child_categories_active', 600, fn() => 
            ChildCategory::where('status', 'Active')->get(['id', 'child_name'])
        );

        return Inertia::render('inventory-counts/index', [
            'inventoryCounts' => $inventoryCounts,
            'branches' => $branches,
            'inventoryPeriods' => $inventoryPeriods,
            'childCategories' => $childCategories,
            'filters' => [
                'search' => $request->query('search'),
                'branch_id' => $request->query('branch_id'),
                'inventory_period_id' => $periodId ? (string) $periodId : null,
                'child_category_id' => $request->query('child_category_id'),
                'product_id' => $request->query('product_id'),
                'approval_status' => $request->query('approval_status'),
                'per_page' => $request->query('per_page'),
            ],
            'canManageAllBranches' => $canManageAllBranches,
            'canApprove' => $user->can('approve inventory counts'),
            'canUnapprove' => $user->can('unapprove inventory counts'),
            'selectedPeriodStatus' => $periodId ? InventoryPeriod::find($periodId)?->status : null,
        ]);
    }

    /**
     * Show the form for creating a new inventory count.
     */
    public function create(): Response
    {
        $user = auth()->user();
        $userBranchId = $user->employee?->branch_id;
        $canManageAllBranches = $user->can('manage all branches inventory');

        // Cache dropdown data for 10 minutes
        $allBranches = Cache::remember('branches_all', 600, fn() => Branch::all(['id', 'name']));
        $branches = $canManageAllBranches 
            ? $allBranches 
            : $allBranches->where('id', $userBranchId)->values();
        
        $inventoryPeriods = Cache::remember('inventory_periods_active', 600, fn() => 
            InventoryPeriod::where('status', 'active')->get(['id', 'inventory_period_name'])
        );
        
        $childCategories = Cache::remember('child_categories_active', 600, fn() => 
            ChildCategory::where('status', 'Active')->get(['id', 'child_name'])
        );
        
        $products = Cache::remember('products_active', 600, fn() => 
            Product::where('status', 'Active')
                ->with('childCategory:id,child_name')
                ->get(['id', 'product_name', 'child_category_id', 'min_count_threshold', 'max_count_threshold', 'status'])
        );

        return Inertia::render('inventory-counts/create', [
            'branches' => $branches,
            'inventoryPeriods' => $inventoryPeriods,
            'childCategories' => $childCategories,
            'products' => $products,
            'canManageAllBranches' => $canManageAllBranches,
            'userBranchId' => $userBranchId,
        ]);
    }

    /**
     * Store a newly created inventory count in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        $userBranchId = $user->employee?->branch_id;
        $canManageAllBranches = $user->can('manage all branches inventory');

        $validated = $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'inventory_period_id' => ['required', 'integer', 'exists:inventory_periods,id'],
            'child_category_id' => ['required', 'integer', 'exists:child_categories,id'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'count' => [
                'required',
                'numeric',
                'min:0',
                new ValidateInventoryCount(
                    $request->input('product_id'),
                    $request->input('branch_id'),
                    $request->input('inventory_period_id')
                )
            ],
        ]);

        // Check if inventory period is active
        $inventoryPeriod = InventoryPeriod::find($validated['inventory_period_id']);
        if (!$inventoryPeriod || $inventoryPeriod->status !== 'active') {
            $periodName = $inventoryPeriod ? $inventoryPeriod->inventory_period_name : 'the selected period';
            return back()->withErrors(['inventory_period_id' => '🔒 Cannot create counts for closed periods. ' . $periodName . ' is no longer active. Please select an active inventory period.']);
        }

        // Ensure user can only create inventory counts for their own branch unless they have permission
        if (!$canManageAllBranches && $userBranchId && $validated['branch_id'] != $userBranchId) {
            return back()->withErrors(['branch_id' => '🚫 Access denied: You can only create inventory counts for your own branch. Please contact your manager if you need access to other branches.']);
        }

        $validated['created_by'] = auth()->id();
        $validated['updated_by'] = auth()->id();

        // Get the current unit cost from the product
        $product = Product::find($validated['product_id']);
        $validated['unit_price'] = $product ? $product->unit_cost : 0;

        // Check if a count already exists for this product in this period and branch
        $existingCount = InventoryCount::where('inventory_period_id', $validated['inventory_period_id'])
            ->where('product_id', $validated['product_id'])
            ->where('branch_id', $validated['branch_id'])
            ->first();

        if ($existingCount) {
            // Update existing count (overwrite)
            $existingCount->update([
                'child_category_id' => $validated['child_category_id'],
                'count' => $validated['count'],
                'unit_price' => $validated['unit_price'],
                'updated_by' => auth()->id(),
            ]);
            
            $productName = $existingCount->product->product_name ?? 'this product';
            return redirect()->route('inventory-counts.index')
                ->with('success', '✓ Count updated successfully for ' . $productName . '. Your previous count was overwritten.');
        } else {
            // Create new count
            $count = InventoryCount::create($validated);
            $productName = $count->product->product_name ?? 'this product';

            return redirect()->route('inventory-counts.index')
                ->with('success', '✓ Count created successfully for ' . $productName . '.');
        }
    }

    /**
     * Show the form for editing the specified inventory count.
     */
    public function edit(InventoryCount $inventoryCount): Response
    {
        $user = auth()->user();
        $userBranchId = $user->employee?->branch_id;
        $canManageAllBranches = $user->can('manage all branches inventory');

        // Check if inventory period is active
        if ($inventoryCount->inventoryPeriod->status !== 'active') {
            abort(403, 'Cannot edit inventory count for inactive period.');
        }

        // Ensure user can only edit inventory counts from their own branch unless they have permission
        if (!$canManageAllBranches && $userBranchId && $inventoryCount->branch_id != $userBranchId) {
            abort(403, 'You can only edit inventory counts from your own branch.');
        }

        return Inertia::render('inventory-counts/edit', [
            'inventoryCount' => $inventoryCount->load([
                'branch:id,name',
                'inventoryPeriod:id,inventory_period_name,status',
                'childCategory:id,child_name',
                'product:id,product_name',
            ]),
            'branches' => $canManageAllBranches ? Branch::all(['id', 'name']) : Branch::where('id', $userBranchId)->get(['id', 'name']),
            'inventoryPeriods' => InventoryPeriod::where('status', 'active')->get(['id', 'inventory_period_name']),
            'childCategories' => ChildCategory::where('status', 'Active')->get(['id', 'child_name']),
            'products' => Product::with('childCategory:id,child_name')->get(['id', 'product_name', 'child_category_id']),
            'canManageAllBranches' => $canManageAllBranches,
        ]);
    }

    /**
     * Update the specified inventory count in storage.
     */
    public function update(Request $request, InventoryCount $inventoryCount): RedirectResponse
    {
        $user = auth()->user();
        $userBranchId = $user->employee?->branch_id;
        $canManageAllBranches = $user->can('manage all branches inventory');

        // Check if inventory period is active
        if ($inventoryCount->inventoryPeriod->status !== 'active') {
            $periodName = $inventoryCount->inventoryPeriod->inventory_period_name;
            return back()->withErrors(['error' => '🔒 Cannot update counts from closed periods. ' . $periodName . ' is no longer active. Please contact your manager if you need to make changes.']);
        }

        // Ensure user can only update inventory counts from their own branch unless they have permission
        if (!$canManageAllBranches && $userBranchId && $inventoryCount->branch_id != $userBranchId) {
            return back()->withErrors(['error' => '🚫 Access denied: You can only update inventory counts from your own branch. Please contact your manager if you need access to other branches.']);
        }

        $validated = $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'inventory_period_id' => ['required', 'integer', 'exists:inventory_periods,id'],
            'child_category_id' => ['required', 'integer', 'exists:child_categories,id'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'count' => [
                'required',
                'numeric',
                'min:0',
                new ValidateInventoryCount(
                    $request->input('product_id'),
                    $request->input('branch_id'),
                    $request->input('inventory_period_id'),
                    $inventoryCount->id
                )
            ],
        ]);

        // Check if new period is active
        $newInventoryPeriod = InventoryPeriod::find($validated['inventory_period_id']);
        if (!$newInventoryPeriod || $newInventoryPeriod->status !== 'active') {
            $periodName = $newInventoryPeriod ? $newInventoryPeriod->inventory_period_name : 'the selected period';
            return back()->withErrors(['inventory_period_id' => '🔒 Cannot move count to a closed period. ' . $periodName . ' is not active. Please select an active inventory period.']);
        }

        // Prevent changing branch_id to a different branch unless user has permission
        if (!$canManageAllBranches && isset($validated['branch_id']) && $validated['branch_id'] != $userBranchId) {
            return back()->withErrors(['branch_id' => '🚫 Access denied: You cannot move counts to a different branch. Please contact your manager if you need access to other branches.']);
        }

        $validated['updated_by'] = auth()->id();

        // Get the current unit cost from the product
        $product = Product::find($validated['product_id']);
        $validated['unit_price'] = $product ? $product->unit_cost : 0;

        $inventoryCount->update($validated);
        
        $productName = $inventoryCount->product->product_name ?? 'this product';

        return redirect()->route('inventory-counts.index')
            ->with('success', '✓ Count updated successfully for ' . $productName . '.');
    }

    /**
     * Remove the specified inventory count from storage.
     */
    public function destroy(InventoryCount $inventoryCount): RedirectResponse
    {
        $user = auth()->user();
        $userBranchId = $user->employee?->branch_id;
        $canManageAllBranches = $user->can('manage all branches inventory');

        // Ensure user can only delete inventory counts from their own branch unless they have permission
        if (!$canManageAllBranches && $userBranchId && $inventoryCount->branch_id != $userBranchId) {
            return back()->withErrors(['error' => '🚫 Access denied: You can only delete inventory counts from your own branch. Please contact your manager if you need access to other branches.']);
        }

        $productName = $inventoryCount->product->product_name ?? 'this product';
        $inventoryCount->delete();

        return redirect()->route('inventory-counts.index')
            ->with('success', '✓ Count deleted successfully for ' . $productName . '.');
    }

    /**
     * Get previous counts for products in a specific period and branch.
     */
    public function getPreviousCounts(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'branch_id' => ['required', 'integer', 'exists:branches,id'],
                'inventory_period_id' => ['required', 'integer', 'exists:inventory_periods,id'],
                'child_category_id' => ['required', 'integer', 'exists:child_categories,id'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Please make sure you have selected a branch, inventory period, and product category.',
                'details' => 'Some required information is missing or invalid.'
            ], 422);
        }

        $user = auth()->user();
        $userBranchId = $user->employee?->branch_id;
        $canManageAllBranches = $user->can('manage all branches inventory');

        // Ensure user can only view inventory counts from their own branch unless they have permission
        if (!$canManageAllBranches && $userBranchId && $validated['branch_id'] != $userBranchId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied: You can only view counts for your own branch.',
                'details' => 'Please contact your manager if you need access to other branches.'
            ], 403);
        }

        try {
            $counts = InventoryCount::where('branch_id', $validated['branch_id'])
                ->where('inventory_period_id', $validated['inventory_period_id'])
                ->where('child_category_id', $validated['child_category_id'])
                ->with('product:id,product_name,min_count_threshold,max_count_threshold')
                ->get()
                ->keyBy('product_id');

            return response()->json([
                'success' => true,
                'counts' => $counts,
                'message' => count($counts) > 0 
                    ? 'Found ' . count($counts) . ' previous count(s) for this category.' 
                    : 'No previous counts found. You can start entering new counts.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to load previous counts at this time.',
                'details' => 'Please refresh the page and try again. If the problem persists, contact support.'
            ], 500);
        }
    }

    /**
     * Auto-save a single inventory count.
     */
    public function autoSave(Request $request): JsonResponse
    {
        $user = auth()->user();
        $userBranchId = $user->employee?->branch_id;
        $canManageAllBranches = $user->can('manage all branches inventory');

        // Get product name for better error messages
        $product = Product::find($request->input('product_id'));
        $productName = $product ? $product->product_name : 'this product';

        try {
            $validated = $request->validate([
                'branch_id' => ['required', 'integer', 'exists:branches,id'],
                'inventory_period_id' => ['required', 'integer', 'exists:inventory_periods,id'],
                'child_category_id' => ['required', 'integer', 'exists:child_categories,id'],
                'product_id' => ['required', 'integer', 'exists:products,id'],
                'count' => [
                    'required',
                    'numeric',
                    'min:0',
                    new ValidateInventoryCount(
                        $request->input('product_id'),
                        $request->input('branch_id'),
                        $request->input('inventory_period_id')
                    )
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Get the first error message
            $errors = $e->errors();
            $firstError = reset($errors)[0] ?? 'Invalid count value';
            
            // Make error messages more user-friendly
            if (str_contains($firstError, 'must be at least')) {
                $message = "⚠️ Count too low: {$firstError}";
            } elseif (str_contains($firstError, 'cannot exceed')) {
                $message = "⚠️ Count too high: {$firstError}";
            } elseif (str_contains($firstError, 'count field is required')) {
                $message = "Please enter a count value for {$productName}";
            } elseif (str_contains($firstError, 'count must be a number')) {
                $message = "Please enter a valid number for {$productName}";
            } elseif (str_contains($firstError, 'count must be at least 0')) {
                $message = "Count cannot be negative. Please enter 0 or more.";
            } else {
                $message = $firstError;
            }
            
            return response()->json([
                'success' => false,
                'message' => $message,
                'details' => 'Please check the value and try again.'
            ], 422);
        }

        // Check if inventory period is active
        $inventoryPeriod = InventoryPeriod::find($validated['inventory_period_id']);
        if (!$inventoryPeriod) {
            return response()->json([
                'success' => false,
                'message' => 'Inventory period not found.',
                'details' => 'The selected inventory period no longer exists. Please refresh the page.'
            ], 404);
        }
        
        if ($inventoryPeriod->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => '🔒 This inventory period is closed.',
                'details' => 'You cannot add or update counts for closed periods. Please contact your manager if you need to make changes.'
            ], 400);
        }

        // Ensure user can only create inventory counts for their own branch unless they have permission
        if (!$canManageAllBranches && $userBranchId && $validated['branch_id'] != $userBranchId) {
            return response()->json([
                'success' => false,
                'message' => '🚫 Access denied: You can only enter counts for your own branch.',
                'details' => 'Please contact your manager if you need access to other branches.'
            ], 403);
        }

        try {
            // Get the current unit cost from the product
            $validated['unit_price'] = $product ? $product->unit_cost : 0;

            // Check if a count already exists for this product in this period and branch
            $existingCount = InventoryCount::where('inventory_period_id', $validated['inventory_period_id'])
                ->where('product_id', $validated['product_id'])
                ->where('branch_id', $validated['branch_id'])
                ->first();

            if ($existingCount) {
                // Update existing count (overwrite)
                $existingCount->update([
                    'child_category_id' => $validated['child_category_id'],
                    'count' => $validated['count'],
                    'unit_price' => $validated['unit_price'],
                    'updated_by' => auth()->id(),
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => '✓ Count updated for ' . $productName,
                    'data' => $existingCount,
                    'action' => 'updated'
                ], 200);
            } else {
                // Create new count
                $validated['created_by'] = auth()->id();
                $validated['updated_by'] = auth()->id();
                $count = InventoryCount::create($validated);

                return response()->json([
                    'success' => true,
                    'message' => '✓ Count saved for ' . $productName,
                    'data' => $count,
                    'action' => 'created'
                ], 201);
            }
        } catch (\Exception $e) {
            \Log::error('Inventory count save error', [
                'product_id' => $validated['product_id'] ?? null,
                'product_name' => $productName,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => '❌ Unable to save count for ' . $productName,
                'details' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store multiple inventory counts at once.
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $user = auth()->user();
        $userBranchId = $user->employee?->branch_id;
        $canManageAllBranches = $user->can('manage all branches inventory');

        $request->validate([
            'counts' => ['required', 'array', 'min:1'],
            'counts.*.branch_id' => ['required', 'integer', 'exists:branches,id'],
            'counts.*.inventory_period_id' => ['required', 'integer', 'exists:inventory_periods,id'],
            'counts.*.child_category_id' => ['required', 'integer', 'exists:child_categories,id'],
            'counts.*.product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $counts = $request->input('counts');
        
        foreach ($counts as $index => $countData) {
            $validator = validator($countData, [
                'count' => [
                    'required',
                    'numeric',
                    'min:0',
                    new ValidateInventoryCount(
                        $countData['product_id'],
                        $countData['branch_id'],
                        $countData['inventory_period_id']
                    )
                ],
            ]);

            if ($validator->fails()) {
                return back()->withErrors([
                    "counts.{$index}.count" => $validator->errors()->first('count')
                ])->withInput();
            }
        }

        $validated = $request->input('counts');

        // Check if all periods are active
        $periodIds = array_unique(array_column($validated, 'inventory_period_id'));
        $inactivePeriods = InventoryPeriod::whereIn('id', $periodIds)
            ->where('status', '!=', 'active')
            ->get();

        if ($inactivePeriods->isNotEmpty()) {
            $periodNames = $inactivePeriods->pluck('inventory_period_name')->implode(', ');
            return back()->withErrors(['counts' => '🔒 Cannot create counts for closed periods: ' . $periodNames . '. Please select only active inventory periods.']);
        }

        // Ensure all counts are for the user's branch unless they have permission
        if (!$canManageAllBranches) {
            foreach ($validated as $countData) {
                if ($userBranchId && $countData['branch_id'] != $userBranchId) {
                    return back()->withErrors(['counts' => '🚫 Access denied: You can only create inventory counts for your own branch. Please contact your manager if you need access to other branches.']);
                }
            }
        }

        $userId = auth()->id();
        $createdCount = 0;
        $updatedCount = 0;

        foreach ($validated as $countData) {
            // Get the current unit cost from the product
            $product = Product::find($countData['product_id']);
            $countData['unit_price'] = $product ? $product->unit_cost : 0;

            // Check if a count already exists for this product in this period and branch
            $existingCount = InventoryCount::where('inventory_period_id', $countData['inventory_period_id'])
                ->where('product_id', $countData['product_id'])
                ->where('branch_id', $countData['branch_id'])
                ->first();

            if ($existingCount) {
                // Update existing count (overwrite)
                $existingCount->update([
                    'child_category_id' => $countData['child_category_id'],
                    'count' => $countData['count'],
                    'unit_price' => $countData['unit_price'],
                    'updated_by' => $userId,
                ]);
                $updatedCount++;
            } else {
                // Create new count
                $countData['created_by'] = $userId;
                $countData['updated_by'] = $userId;
                InventoryCount::create($countData);
                $createdCount++;
            }
        }

        $message = [];
        if ($createdCount > 0) {
            $message[] = "✓ $createdCount count(s) created";
        }
        if ($updatedCount > 0) {
            $message[] = "$updatedCount count(s) updated";
        }

        return back()->with('success', implode(' and ', $message) . ' successfully.');
    }

    /**
     * API: Approve a single inventory count - returns JSON
     */
    public function apiApprove(InventoryCount $inventoryCount): JsonResponse
    {
        $user = auth()->user();

        if (!$user->can('approve inventory counts')) {
            return response()->json([
                'success' => false,
                'message' => '🚫 Access denied: You do not have permission to approve inventory counts.',
                'details' => 'Please contact your manager if you need this access.'
            ], 403);
        }

        if ($inventoryCount->is_approved) {
            $approverName = $inventoryCount->approver->name ?? 'another user';
            return response()->json([
                'success' => false,
                'message' => '❌ Approval failed: This count has already been approved by ' . $approverName . '.',
                'details' => 'Please unapprove it first if you need to reapprove.'
            ], 400);
        }

        $productName = $inventoryCount->product->product_name ?? 'this product';
        
        $inventoryCount->update([
            'is_approved' => true,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => '✓ Count approved successfully for ' . $productName,
            'data' => $inventoryCount->load(['approver:id,name']),
        ]);
    }

    /**
     * Inertia: Approve a single inventory count
     */
    public function approve(InventoryCount $inventoryCount): RedirectResponse
    {
        $user = auth()->user();

        if (!$user->can('approve inventory counts')) {
            return back()->withErrors(['error' => '🚫 Access denied: You do not have permission to approve inventory counts. Please contact your manager if you need this access.']);
        }

        // Check if inventory period is active
        if ($inventoryCount->inventoryPeriod->status !== 'active') {
            return back()->withErrors(['error' => '🔒 Cannot approve counts from closed periods. This inventory period (' . $inventoryCount->inventoryPeriod->inventory_period_name . ') is no longer active.']);
        }

        if ($inventoryCount->is_approved) {
            return back()->withErrors(['error' => '❌ Approval failed: This count has already been approved by ' . ($inventoryCount->approver->name ?? 'another user') . '. Please unapprove it first if you need to reapprove.']);
        }

        $productName = $inventoryCount->product->product_name ?? 'this product';
        
        $inventoryCount->update([
            'is_approved' => true,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', '✓ Count approved successfully for ' . $productName . '.');
    }

    /**
     * API: Unapprove a single inventory count - returns JSON
     */
    public function apiUnapprove(InventoryCount $inventoryCount): JsonResponse
    {
        $user = auth()->user();

        if (!$user->can('unapprove inventory counts')) {
            return response()->json([
                'success' => false,
                'message' => '🚫 Access denied: You do not have permission to unapprove inventory counts.',
                'details' => 'Please contact your manager if you need this access.'
            ], 403);
        }

        if (!$inventoryCount->is_approved) {
            return response()->json([
                'success' => false,
                'message' => '❌ Unapproval failed: This count is not currently approved, so it cannot be unapproved.',
                'details' => 'Please approve it first if needed.'
            ], 400);
        }

        $productName = $inventoryCount->product->product_name ?? 'this product';
        
        $inventoryCount->update([
            'is_approved' => false,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => '✓ Approval removed successfully for ' . $productName,
            'data' => $inventoryCount,
        ]);
    }

    /**
     * Inertia: Unapprove a single inventory count
     */
    public function unapprove(InventoryCount $inventoryCount): RedirectResponse
    {
        $user = auth()->user();

        if (!$user->can('unapprove inventory counts')) {
            return back()->withErrors(['error' => '🚫 Access denied: You do not have permission to unapprove inventory counts. Please contact your manager if you need this access.']);
        }

        // Check if inventory period is active
        if ($inventoryCount->inventoryPeriod->status !== 'active') {
            return back()->withErrors(['error' => '🔒 Cannot unapprove counts from closed periods. This inventory period (' . $inventoryCount->inventoryPeriod->inventory_period_name . ') is no longer active.']);
        }

        if (!$inventoryCount->is_approved) {
            return back()->withErrors(['error' => '❌ Unapproval failed: This count is not currently approved, so it cannot be unapproved. Please approve it first if needed.']);
        }

        $productName = $inventoryCount->product->product_name ?? 'this product';
        
        $inventoryCount->update([
            'is_approved' => false,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return back()->with('success', '✓ Approval removed successfully for ' . $productName . '.');
    }

    /**
     * API: Approve multiple inventory counts at once - returns JSON
     */
    public function apiBulkApprove(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (!$user->can('approve inventory counts')) {
            return response()->json([
                'success' => false,
                'message' => '🚫 Access denied: You do not have permission to approve inventory counts.',
                'details' => 'Please contact your manager if you need this access.'
            ], 403);
        }

        try {
            $validated = $request->validate([
                'ids' => ['required', 'array', 'min:1'],
                'ids.*' => ['required', 'integer', 'exists:inventory_counts,id'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => '⚠️ Invalid selection: Please select at least one count to approve.',
                'details' => 'Make sure you have selected valid inventory counts.'
            ], 422);
        }

        $counts = InventoryCount::whereIn('id', $validated['ids'])
            ->where('is_approved', false)
            ->get();

        if ($counts->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => '❌ Bulk approval failed: All selected counts are already approved or do not exist.',
                'details' => 'Please select counts that need approval, or refresh the page to see the latest status.'
            ], 400);
        }

        $userId = auth()->id();
        $now = now();

        foreach ($counts as $count) {
            $count->update([
                'is_approved' => true,
                'approved_by' => $userId,
                'approved_at' => $now,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => '✓ Successfully approved ' . count($counts) . ' inventory count(s)',
            'data' => $counts->load(['approver:id,name']),
        ]);
    }

    /**
     * Inertia: Approve multiple inventory counts at once
     */
    public function bulkApprove(Request $request): RedirectResponse
    {
        $user = auth()->user();

        if (!$user->can('approve inventory counts')) {
            return back()->withErrors(['error' => '🚫 Access denied: You do not have permission to approve inventory counts. Please contact your manager if you need this access.']);
        }

        try {
            $validated = $request->validate([
                'ids' => ['required', 'array', 'min:1'],
                'ids.*' => ['required', 'integer', 'exists:inventory_counts,id'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors(['error' => '⚠️ Invalid selection: Please select at least one count to approve.']);
        }

        $counts = InventoryCount::with(['inventoryPeriod', 'product'])
            ->whereIn('id', $validated['ids'])
            ->where('is_approved', false)
            ->get();

        $totalRequested = count($validated['ids']);
        $foundCount = $counts->count();

        if ($counts->isEmpty()) {
            return back()->withErrors(['error' => '❌ Bulk approval failed: All selected counts are already approved or do not exist. Please select counts that need approval.']);
        }

        // Check if all counts are from active periods
        $inactiveCounts = $counts->filter(function ($count) {
            return $count->inventoryPeriod->status !== 'active';
        });

        if ($inactiveCounts->isNotEmpty()) {
            $periodNames = $inactiveCounts->pluck('inventoryPeriod.inventory_period_name')->unique()->implode(', ');
            return back()->withErrors(['error' => '🔒 Cannot approve counts from closed periods: ' . $periodNames . '. Please select only counts from active periods.']);
        }

        $userId = auth()->id();
        $now = now();
        $approvedCount = 0;

        try {
            foreach ($counts as $count) {
                $count->update([
                    'is_approved' => true,
                    'approved_by' => $userId,
                    'approved_at' => $now,
                ]);
                $approvedCount++;
            }

            $message = "✓ Successfully approved {$approvedCount} inventory count(s)";
            
            // Add info about already approved items if some were skipped
            if ($foundCount < $totalRequested) {
                $skipped = $totalRequested - $foundCount;
                $message .= ". ({$skipped} count(s) were already approved)";
            }
            
            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => '❌ An error occurred while approving counts. Please try again. If the problem persists, contact support.']);
        }
    }

    /**
     * API: Unapprove multiple inventory counts at once - returns JSON
     */
    public function apiBulkUnapprove(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (!$user->can('unapprove inventory counts')) {
            return response()->json([
                'success' => false,
                'message' => '🚫 Access denied: You do not have permission to unapprove inventory counts.',
                'details' => 'Please contact your manager if you need this access.'
            ], 403);
        }

        try {
            $validated = $request->validate([
                'ids' => ['required', 'array', 'min:1'],
                'ids.*' => ['required', 'integer', 'exists:inventory_counts,id'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => '⚠️ Invalid selection: Please select at least one count to unapprove.',
                'details' => 'Make sure you have selected valid inventory counts.'
            ], 422);
        }

        $counts = InventoryCount::whereIn('id', $validated['ids'])
            ->where('is_approved', true)
            ->get();

        if ($counts->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'ℹ️ No approved counts found. All selected counts are already unapproved or do not exist.',
                'details' => 'Refresh the page to see the latest status.'
            ], 400);
        }

        foreach ($counts as $count) {
            $count->update([
                'is_approved' => false,
                'approved_by' => null,
                'approved_at' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => '✓ Successfully removed approval from ' . count($counts) . ' inventory count(s)',
            'data' => $counts,
        ]);
    }

    /**
     * Inertia: Unapprove multiple inventory counts at once
     */
    public function bulkUnapprove(Request $request): RedirectResponse
    {
        $user = auth()->user();

        if (!$user->can('unapprove inventory counts')) {
            return back()->withErrors(['error' => '🚫 Access denied: You do not have permission to unapprove inventory counts. Please contact your manager if you need this access.']);
        }

        try {
            $validated = $request->validate([
                'ids' => ['required', 'array', 'min:1'],
                'ids.*' => ['required', 'integer', 'exists:inventory_counts,id'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors(['error' => '⚠️ Invalid selection: Please select at least one count to unapprove.']);
        }

        $counts = InventoryCount::with(['inventoryPeriod', 'product'])
            ->whereIn('id', $validated['ids'])
            ->where('is_approved', true)
            ->get();

        $totalRequested = count($validated['ids']);
        $foundCount = $counts->count();

        if ($counts->isEmpty()) {
            return back()->withErrors(['error' => '❌ Bulk unapproval failed: All selected counts are already unapproved or do not exist. Please select counts that are approved.']);
        }

        // Check if all counts are from active periods
        $inactiveCounts = $counts->filter(function ($count) {
            return $count->inventoryPeriod->status !== 'active';
        });

        if ($inactiveCounts->isNotEmpty()) {
            $periodNames = $inactiveCounts->pluck('inventoryPeriod.inventory_period_name')->unique()->implode(', ');
            return back()->withErrors(['error' => '🔒 Cannot unapprove counts from closed periods: ' . $periodNames . '. Please select only counts from active periods.']);
        }

        $unapprovedCount = 0;

        try {
            foreach ($counts as $count) {
                $count->update([
                    'is_approved' => false,
                    'approved_by' => null,
                    'approved_at' => null,
                ]);
                $unapprovedCount++;
            }

            $message = "✓ Successfully removed approval from {$unapprovedCount} inventory count(s)";
            
            // Add info about already unapproved items if some were skipped
            if ($foundCount < $totalRequested) {
                $skipped = $totalRequested - $foundCount;
                $message .= ". ({$skipped} count(s) were already unapproved)";
            }
            
            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => '❌ An error occurred while unapproving counts. Please try again. If the problem persists, contact support.']);
        }
    }
}

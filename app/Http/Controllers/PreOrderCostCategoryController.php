<?php

namespace App\Http\Controllers;

use App\Models\PreOrderCostCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PreOrderCostCategoryController extends Controller
{
    public function index()
    {
        if (!auth()->user()->can('manage pre-order costs')) {
            abort(403);
        }

        return Inertia::render('pre-orders/costs/categories', [
            'categories' => PreOrderCostCategory::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->can('manage pre-order costs')) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:pre_order_cost_categories,name',
            'description' => 'nullable|string',
        ]);

        PreOrderCostCategory::create($validated);

        return redirect()->back()->with('success', 'Category created successfully.');
    }

    public function update(Request $request, PreOrderCostCategory $preOrderCostCategory)
    {
        if (!auth()->user()->can('manage pre-order costs')) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:pre_order_cost_categories,name,' . $preOrderCostCategory->id,
            'description' => 'nullable|string',
        ]);

        $preOrderCostCategory->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully.');
    }

    public function destroy(PreOrderCostCategory $preOrderCostCategory)
    {
        if (!auth()->user()->can('manage pre-order costs')) {
            abort(403);
        }

        if ($preOrderCostCategory->costs()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete category that has cost records.');
        }

        $preOrderCostCategory->delete();

        return redirect()->back()->with('success', 'Category deleted successfully.');
    }
}

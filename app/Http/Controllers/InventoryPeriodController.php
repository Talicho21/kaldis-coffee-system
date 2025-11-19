<?php

namespace App\Http\Controllers;

use App\Models\FiscalMonth;
use App\Models\FiscalYear;
use App\Models\InventoryPeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryPeriodController extends Controller
{
    /**
     * Display a listing of the inventory periods.
     */
    public function index(Request $request): Response
    {
        $query = InventoryPeriod::query()->with(['fiscalYear:id,name', 'fiscalMonth:id,name,fiscal_year_id']);

        if ($search = $request->query('search')) {
            $query->where('inventory_period_name', 'like', "%{$search}%");
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($fiscalYearId = $request->query('fiscal_year_id')) {
            $query->where('fiscal_year_id', $fiscalYearId);
        }

        if ($fiscalMonthId = $request->query('fiscal_month_id')) {
            $query->where('fiscal_month_id', $fiscalMonthId);
        }

        $perPage = max((int) $request->query('per_page', 15), 1);

        $periods = $query->orderByDesc('id')->paginate($perPage)->withQueryString();

        return Inertia::render('inventory-periods/Index', [
            'inventoryPeriods' => $periods,
            'fiscalYears' => FiscalYear::all(['id', 'name']),
            'fiscalMonths' => FiscalMonth::all(['id', 'name', 'fiscal_year_id']),
            'filters' => $request->only(['search', 'status', 'fiscal_year_id', 'fiscal_month_id', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new inventory period.
     */
    public function create(): Response
    {
        return Inertia::render('inventory-periods/Create', [
            'fiscalYears' => FiscalYear::all(['id', 'name']),
            'fiscalMonths' => FiscalMonth::all(['id', 'name', 'fiscal_year_id']),
        ]);
    }

    /**
     * Store a newly created inventory period.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'inventory_period_name' => ['required', 'string', 'max:191'],
            'fiscal_year_id' => ['required', 'integer', 'exists:fiscal_years,id'],
            'fiscal_month_id' => ['required', 'integer', 'exists:fiscal_months,id'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        InventoryPeriod::create($validated);

        return redirect()->route('inventory-periods.index')
            ->with('success', 'Inventory period created successfully.');
    }

    /**
     * Show the form for editing the specified inventory period.
     */
    public function edit(InventoryPeriod $inventoryPeriod): Response
    {
        return Inertia::render('inventory-periods/Edit', [
            'inventoryPeriod' => $inventoryPeriod->load(['fiscalYear:id,name', 'fiscalMonth:id,name,fiscal_year_id']),
            'fiscalYears' => FiscalYear::all(['id', 'name']),
            'fiscalMonths' => FiscalMonth::all(['id', 'name', 'fiscal_year_id']),
        ]);
    }

    /**
     * Update the specified inventory period in storage.
     */
    public function update(Request $request, InventoryPeriod $inventoryPeriod): RedirectResponse
    {
        $validated = $request->validate([
            'inventory_period_name' => ['required', 'string', 'max:191'],
            'fiscal_year_id' => ['required', 'integer', 'exists:fiscal_years,id'],
            'fiscal_month_id' => ['required', 'integer', 'exists:fiscal_months,id'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $inventoryPeriod->update($validated);

        return redirect()->route('inventory-periods.index')
            ->with('success', 'Inventory period updated successfully.');
    }

    /**
     * Remove the specified inventory period from storage.
     */
    public function destroy(InventoryPeriod $inventoryPeriod): RedirectResponse
    {
        $inventoryPeriod->delete();

        return redirect()->route('inventory-periods.index')
            ->with('success', 'Inventory period deleted successfully.');
    }
}



<?php

namespace App\Http\Controllers;

use App\Models\PreOrderProduct;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PreOrderProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = PreOrderProduct::query();

        if ($search = $request->query('search')) {
            $query->where('product_name', 'like', "%{$search}%");
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $perPage = (int) $request->query('per_page', 15);
        $products = $query->orderByDesc('id')->paginate($perPage)->withQueryString();

        return Inertia::render('settings/pre-order-products/Index', [
            'products' => $products,
            'filters' => [
                'search' => $request->query('search'),
                'status' => $request->query('status'),
                'per_page' => $request->query('per_page'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('settings/pre-order-products/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_name' => ['required', 'string', 'max:255'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:Active,Inactive'],
        ]);

        PreOrderProduct::create($validated);

        return redirect()->route('pre-order-products.index')
            ->with('success', 'Pre-order product created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(PreOrderProduct $preOrderProduct): Response
    {
        return Inertia::render('settings/pre-order-products/Show', [
            'product' => $preOrderProduct,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PreOrderProduct $preOrderProduct): Response
    {
        return Inertia::render('settings/pre-order-products/Edit', [
            'product' => $preOrderProduct,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PreOrderProduct $preOrderProduct): RedirectResponse
    {
        $validated = $request->validate([
            'product_name' => ['required', 'string', 'max:255'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:Active,Inactive'],
        ]);

        $preOrderProduct->update($validated);

        return redirect()->route('pre-order-products.index')
            ->with('success', 'Pre-order product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PreOrderProduct $preOrderProduct): RedirectResponse
    {
        $preOrderProduct->delete();

        return redirect()->route('pre-order-products.index')
            ->with('success', 'Pre-order product deleted successfully.');
    }
}

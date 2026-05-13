<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Models\OrderType;
use App\Models\PreOrderTarget;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PreOrderTargetController extends Controller
{
    public function index(): Response
    {
        abort_unless(auth()->user()->can('manage pre-order targets'), 403);

        $targets = PreOrderTarget::with(['holiday:id,name', 'orderType:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'holiday' => $t->holiday?->only('id', 'name'),
                'order_type' => $t->orderType?->only('id', 'name'),
                'target_count' => $t->target_count,
                'created_at' => $t->created_at?->toDateString(),
            ]);

        $holidays = Holiday::orderByDesc('created_at')->get(['id', 'name']);
        $orderTypes = OrderType::orderBy('name')->get(['id', 'name']);

        return Inertia::render('pre-orders/targets', [
            'targets' => $targets,
            'holidays' => $holidays,
            'orderTypes' => $orderTypes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->can('manage pre-order targets'), 403);
        $validated = $request->validate([
            'holiday_id' => ['required', 'exists:holidays,id'],
            'order_type_id' => ['nullable', 'exists:order_types,id'],
            'target_count' => ['required', 'integer', 'min:1'],
        ]);

        // Upsert so re-saving the same holiday+type just updates the count
        PreOrderTarget::updateOrCreate(
            [
                'holiday_id' => $validated['holiday_id'],
                'order_type_id' => $validated['order_type_id'] ?? null,
            ],
            [
                'target_count' => $validated['target_count'],
                'created_by' => auth()->id(),
            ]
        );

        return back()->with('success', 'Target saved.');
    }

    public function update(Request $request, PreOrderTarget $preOrderTarget): RedirectResponse
    {
        abort_unless(auth()->user()->can('manage pre-order targets'), 403);
        $validated = $request->validate([
            'target_count' => ['required', 'integer', 'min:1'],
        ]);

        $preOrderTarget->update($validated);

        return back()->with('success', 'Target updated.');
    }

    public function destroy(PreOrderTarget $preOrderTarget): RedirectResponse
    {
        abort_unless(auth()->user()->can('manage pre-order targets'), 403);
        $preOrderTarget->delete();

        return back()->with('success', 'Target deleted.');
    }
}

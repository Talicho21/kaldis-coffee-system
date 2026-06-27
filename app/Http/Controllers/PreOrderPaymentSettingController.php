<?php

namespace App\Http\Controllers;

use App\Models\PreOrderPaymentSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PreOrderPaymentSettingController extends Controller
{
    public function index()
    {
        $settings = PreOrderPaymentSetting::orderBy('id')->get();
        return Inertia::render('pre-orders/settings/payment-settings', [
            'paymentSettings' => $settings,
        ]);
    }

    public function update(Request $request, PreOrderPaymentSetting $preOrderPaymentSetting)
    {
        $validated = $request->validate([
            'validation_pattern' => 'nullable|string|max:255',
            'example' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        // Specific rule to ensure pattern is a valid regex
        if (!empty($validated['validation_pattern'])) {
            $isValidPattern = @preg_match('/' . $validated['validation_pattern'] . '/', '') !== false;
            if (!$isValidPattern) {
                return back()->withErrors(['validation_pattern' => 'The provided regex pattern is invalid.']);
            }
        }

        $preOrderPaymentSetting->update($validated);

        return back()->with('success', 'Payment setting updated successfully.');
    }
}

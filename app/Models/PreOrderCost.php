<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreOrderCost extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'holiday_id',
        'amount',
        'date',
        'notes',
        'created_by',
        'pre_order_product_id',
        'product_cost_per_unit',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'product_cost_per_unit' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * Get category that owns this cost.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(PreOrderCostCategory::class);
    }

    /**
     * Get holiday that owns this cost.
     */
    public function holiday(): BelongsTo
    {
        return $this->belongsTo(Holiday::class);
    }

    /**
     * Get user who created this cost.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get pre-order product associated with this cost (for product costs).
     */
    public function preOrderProduct(): BelongsTo
    {
        return $this->belongsTo(PreOrderProduct::class);
    }

    /**
     * Scope to get costs for a specific holiday.
     */
    public function scopeForHoliday($query, $holidayId)
    {
        return $query->where('holiday_id', $holidayId);
    }

    /**
     * Check if this is a product cost.
     */
    public function isProductCost(): bool
    {
        return $this->pre_order_product_id !== null;
    }

    /**
     * Check if this is a general cost.
     */
    public function isGeneralCost(): bool
    {
        return $this->pre_order_product_id === null;
    }
}

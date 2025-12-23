<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryCount extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'inventory_period_id',
        'child_category_id',
        'product_id',
        'count',
        'unit_price',
        'is_approved',
        'approved_by',
        'approved_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'count' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'is_approved' => 'boolean',
        'approved_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Branch, InventoryCount>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * @return BelongsTo<InventoryPeriod, InventoryCount>
     */
    public function inventoryPeriod(): BelongsTo
    {
        return $this->belongsTo(InventoryPeriod::class);
    }

    /**
     * @return BelongsTo<ChildCategory, InventoryCount>
     */
    public function childCategory(): BelongsTo
    {
        return $this->belongsTo(ChildCategory::class);
    }

    /**
     * @return BelongsTo<Product, InventoryCount>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<User, InventoryCount>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, InventoryCount>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * @return BelongsTo<User, InventoryCount>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_name',
        'product_code',
        'unit_price',
        'status',
        'child_category_id',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
    ];

    /**
     * @return BelongsTo<ChildCategory, Product>
     */
    public function childCategory(): BelongsTo
    {
        return $this->belongsTo(ChildCategory::class);
    }
}



<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'pre_order_id',
        'pre_order_product_id',
        'quantity',
        'unit_price',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    /**
     * @return BelongsTo<PreOrder, PreOrderItem>
     */
    public function preOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }

    /**
     * @return BelongsTo<PreOrderProduct, PreOrderItem>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(PreOrderProduct::class, 'pre_order_product_id');
    }
}

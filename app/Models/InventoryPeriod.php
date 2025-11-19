<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_period_name',
        'fiscal_year_id',
        'fiscal_month_id',
        'status',
    ];

    protected $casts = [
        'fiscal_year_id' => 'integer',
        'fiscal_month_id' => 'integer',
    ];

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function fiscalMonth(): BelongsTo
    {
        return $this->belongsTo(FiscalMonth::class);
    }

    public function inventoryCounts(): HasMany
    {
        return $this->hasMany(InventoryCount::class);
    }
}



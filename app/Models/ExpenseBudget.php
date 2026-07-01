<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExpenseBudget extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'fiscal_year_id',
        'fiscal_month_id',
        'branch_id',
        'department_id',
        'budget_amount',
        'created_by',
    ];

    protected $casts = [
        'fiscal_year_id' => 'integer',
        'fiscal_month_id' => 'integer',
        'budget_amount' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ExpenseBudgetItem::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ExpenseBudgetActivityLog::class);
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function fiscalMonth(): BelongsTo
    {
        return $this->belongsTo(FiscalMonth::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

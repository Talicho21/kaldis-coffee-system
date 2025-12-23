<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Branch extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::saved(function () {
            Cache::forget('branches_all');
            Cache::forget('branches_all_sorted');
            Cache::forget('branches_inventory_tracking');
        });
        static::deleted(function () {
            Cache::forget('branches_all');
            Cache::forget('branches_all_sorted');
            Cache::forget('branches_inventory_tracking');
        });
    }

    protected $fillable = [
        'branch_code',
        'name',
        'location',
        'contact_email',
        'contact_phone',
        'description',
    ];

    public function departments()
    {
        return $this->belongsToMany(Department::class);
    }
}

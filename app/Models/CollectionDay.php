<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollectionDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_order',
        'status',
    ];

    protected $casts = [
        'display_order' => 'integer',
    ];
}

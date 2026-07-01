<?php

use App\Models\ExpenseBudget;
use App\Models\FiscalMonth;
use App\Models\FiscalYear;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const LEGACY_MONTH_NAMES = [
        1 => 'Meskerem',
        2 => 'Tikimt',
        3 => 'Hidar',
        4 => 'Tahsas',
        5 => 'Tir',
        6 => 'Yekatit',
        7 => 'Megabit',
        8 => 'Miazia',
        9 => 'Ginbot',
        10 => 'Sene',
        11 => 'Hamle',
        12 => 'Nehasse',
    ];

    public function up(): void
    {
        Schema::table('expense_budgets', function (Blueprint $table) {
            $table->dropUnique('expense_budgets_unique_scope');
        });

        Schema::table('expense_budgets', function (Blueprint $table) {
            $table->foreignId('fiscal_year_id')
                ->nullable()
                ->after('id')
                ->constrained('fiscal_years')
                ->cascadeOnDelete();
            $table->foreignId('fiscal_month_id')
                ->nullable()
                ->after('fiscal_year_id')
                ->constrained('fiscal_months')
                ->cascadeOnDelete();
        });

        ExpenseBudget::withTrashed()->get()->each(function (ExpenseBudget $budget) {
            $mapped = $this->mapLegacyPeriod((int) $budget->month, (int) $budget->year);

            if ($mapped) {
                $budget->update([
                    'fiscal_year_id' => $mapped['fiscal_year_id'],
                    'fiscal_month_id' => $mapped['fiscal_month_id'],
                ]);
            }
        });

        Schema::table('expense_budgets', function (Blueprint $table) {
            $table->dropColumn(['month', 'year']);
        });

        Schema::table('expense_budgets', function (Blueprint $table) {
            $table->unique(
                ['fiscal_year_id', 'fiscal_month_id', 'branch_id', 'department_id'],
                'expense_budgets_unique_scope',
            );
        });
    }

    public function down(): void
    {
        Schema::table('expense_budgets', function (Blueprint $table) {
            $table->dropUnique('expense_budgets_unique_scope');
        });

        Schema::table('expense_budgets', function (Blueprint $table) {
            $table->unsignedTinyInteger('month')->nullable()->after('id');
            $table->unsignedSmallInteger('year')->nullable()->after('month');
        });

        ExpenseBudget::withTrashed()
            ->with(['fiscalMonth:id,efy_month_number', 'fiscalYear:id,name'])
            ->get()
            ->each(function (ExpenseBudget $budget) {
                $budget->update([
                    'month' => $budget->fiscalMonth?->efy_month_number,
                    'year' => $this->extractLegacyYear($budget->fiscalYear?->name),
                ]);
            });

        Schema::table('expense_budgets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('fiscal_year_id');
            $table->dropConstrainedForeignId('fiscal_month_id');
            $table->unique(['month', 'year', 'branch_id', 'department_id'], 'expense_budgets_unique_scope');
        });
    }

    /**
     * @return array{fiscal_year_id: int, fiscal_month_id: int}|null
     */
    private function mapLegacyPeriod(int $month, int $year): ?array
    {
        $monthName = self::LEGACY_MONTH_NAMES[$month] ?? null;

        if (! $monthName) {
            return null;
        }

        $fiscalYear = FiscalYear::query()
            ->where('name', 'like', "%{$year}%")
            ->orderByDesc('id')
            ->first();

        if (! $fiscalYear) {
            return null;
        }

        $fiscalMonth = FiscalMonth::query()
            ->where('fiscal_year_id', $fiscalYear->id)
            ->where('name', 'like', "%{$monthName}%")
            ->first();

        if (! $fiscalMonth) {
            return null;
        }

        return [
            'fiscal_year_id' => $fiscalYear->id,
            'fiscal_month_id' => $fiscalMonth->id,
        ];
    }

    private function extractLegacyYear(?string $fiscalYearName): ?int
    {
        if (! $fiscalYearName) {
            return null;
        }

        if (preg_match('/(\d{4})/', $fiscalYearName, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }
};

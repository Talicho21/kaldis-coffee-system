import TablePagination from '@/components/table-pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Pagination } from '@/types/pagination';
import { Head, router } from '@inertiajs/react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Weekly Budgets', href: '/budget/weekly-budget' },
    { title: 'Analytics', href: '/budget/weekly-budget/analytics' },
];

type FiscalYearOption = {
    id: number;
    name: string;
};

type FiscalMonthOption = {
    id: number;
    name: string;
    fiscal_year_id: number;
};

type MatrixRow = {
    id: number;
    fiscal_month: string | null;
    week_number: number;
    budget_code: string | null;
    budget_category: string | null;
    budget_type: string | null;
    amount: number;
    status_department: string;
    status_finance: string;
    status_ceo: string;
};

interface MatrixData extends Pagination {
    data: MatrixRow[];
}

type GraphData = {
    label: string;
    total: number;
};

type AnalyticsProps = {
    counts: {
        ceo_not_paid: number;
        dept_not_finance: number;
        finance_not_ceo: number;
    };
    graphData: GraphData[];
    matrixData: MatrixData;
    fiscalYears: FiscalYearOption[];
    fiscalMonths: FiscalMonthOption[];
    filters: {
        fiscal_year_id?: string;
        fiscal_month_id?: string;
        week_number?: string;
        group_by?: string;
        use_case?: string;
    };
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export default function Analytics({
    counts,
    graphData,
    matrixData,
    fiscalYears,
    fiscalMonths,
    filters,
}: AnalyticsProps) {
    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('weekly-budget.analytics'),
            {
                ...filters,
                [key]: value === 'all' ? undefined : value,
                ...(key === 'fiscal_year_id' ? { fiscal_month_id: undefined, week_number: undefined } : {}),
                ...(key === 'fiscal_month_id' ? { week_number: undefined } : {}),
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleUseCaseClick = (useCase: string) => {
        const newValue = filters.use_case === useCase ? undefined : useCase;
        handleFilterChange('use_case', newValue || 'all');
    };

    const filteredMonths = useMemo(() => {
        if (!filters.fiscal_year_id) return fiscalMonths;
        return fiscalMonths.filter((m) => m.fiscal_year_id.toString() === filters.fiscal_year_id);
    }, [fiscalMonths, filters.fiscal_year_id]);

    const weekOptions = Array.from({ length: 5 }, (_, i) => i + 1);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Summary Analytics" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 md:gap-6 md:p-6 lg:gap-8 lg:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Summary Analytics</h1>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4 flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Select
                                value={filters.fiscal_year_id || 'all'}
                                onValueChange={(v) => handleFilterChange('fiscal_year_id', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Fiscal Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Fiscal Years</SelectItem>
                                    {fiscalYears.map((fy) => (
                                        <SelectItem key={fy.id} value={fy.id.toString()}>
                                            {fy.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Select
                                value={filters.fiscal_month_id || 'all'}
                                onValueChange={(v) => handleFilterChange('fiscal_month_id', v)}
                                disabled={!filters.fiscal_year_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Fiscal Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Months</SelectItem>
                                    {filteredMonths.map((fm) => (
                                        <SelectItem key={fm.id} value={fm.id.toString()}>
                                            {fm.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Select
                                value={filters.week_number || 'all'}
                                onValueChange={(v) => handleFilterChange('week_number', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Fiscal Week" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Weeks</SelectItem>
                                    {weekOptions.map((w) => (
                                        <SelectItem key={w} value={w.toString()}>
                                            Week {w}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card 
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${filters.use_case === 'ceo_not_paid' ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => handleUseCaseClick('ceo_not_paid')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">CEO Approved, Not Paid</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{counts.ceo_not_paid}</div>
                            <p className="text-xs text-muted-foreground mt-1">Pending finance payment</p>
                        </CardContent>
                    </Card>

                    <Card 
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${filters.use_case === 'dept_not_finance' ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => handleUseCaseClick('dept_not_finance')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Dept Approved, Pending Finance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{counts.dept_not_finance}</div>
                            <p className="text-xs text-muted-foreground mt-1">Waiting on Finance</p>
                        </CardContent>
                    </Card>

                    <Card 
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${filters.use_case === 'finance_not_ceo' ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => handleUseCaseClick('finance_not_ceo')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Finance Approved, Pending CEO</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{counts.finance_not_ceo}</div>
                            <p className="text-xs text-muted-foreground mt-1">Waiting on CEO</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Bar Chart */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Budget Totals</CardTitle>
                        <div className="w-[200px]">
                            <Select
                                value={filters.group_by || 'month'}
                                onValueChange={(v) => handleFilterChange('group_by', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Group by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="year">By Year</SelectItem>
                                    <SelectItem value="month">By Month</SelectItem>
                                    <SelectItem value="week">By Week</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {graphData.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No data available for chart.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graphData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `${formatCurrency(value)}`}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatCurrency(value), 'Total']}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="total" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Data Matrix */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Matrix</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fiscal Month</TableHead>
                                        <TableHead>Fiscal Week</TableHead>
                                        <TableHead>Budget Code</TableHead>
                                        <TableHead>Budget Category</TableHead>
                                        <TableHead>Budget Type</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Status (Dept / Fin / CEO)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {matrixData.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        matrixData.data.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{row.fiscal_month}</TableCell>
                                                <TableCell>Week {row.week_number}</TableCell>
                                                <TableCell>{row.budget_code || '-'}</TableCell>
                                                <TableCell>{row.budget_category || '-'}</TableCell>
                                                <TableCell>{row.budget_type || '-'}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                                                <TableCell>
                                                    <span className="text-xs">
                                                        <span className={row.status_department === 'approved' ? 'text-green-600' : ''}>{row.status_department}</span> /{' '}
                                                        <span className={row.status_finance === 'approved' || row.status_finance === 'paid' ? 'text-green-600' : ''}>{row.status_finance}</span> /{' '}
                                                        <span className={row.status_ceo === 'approved' ? 'text-green-600' : ''}>{row.status_ceo}</span>
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {matrixData.data.length > 0 && (
                            <div className="mt-4">
                                <TablePagination links={matrixData.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

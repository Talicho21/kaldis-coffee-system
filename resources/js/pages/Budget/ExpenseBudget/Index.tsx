import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermission } from '@/hooks/user-permissions';
import AppLayout from '@/layouts/app-layout';
import { ETHIOPIAN_FISCAL_MONTHS } from '@/lib/ethiopian-calendar';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import type { Pagination } from '@/types/pagination';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, Filter, Trash2, X } from 'lucide-react';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Budget', href: null },
    { title: 'Expense Budget', href: '/budget/expense-budget' },
];

type BranchOption = {
    id: number;
    name: string;
    branch_code: string | null;
};

type DepartmentOption = {
    id: number;
    name: string;
};

type ExpenseItemOption = {
    id: number;
    name: string;
};

type ExpenseBudgetRow = {
    id: number;
    month: number;
    year: number;
    branch_id: number;
    department_id: number | null;
    branch: string | null;
    department: string | null;
    expense_item_id: number;
    expense_item: string | null;
    planned_budget: string | number;
    actual_budget: number;
    status: string;
    submitted_by: string | null;
};

type EditFormState = {
    month: number;
    year: number;
    branch_id: string;
    department_id: string;
    expense_item_id: number;
    planned_budget: string;
    status: 'draft' | 'submitted' | 'approved';
};

interface ExpenseBudgetList extends Pagination {
    data: ExpenseBudgetRow[];
}

type IndexProps = {
    items: ExpenseBudgetList;
    branches: BranchOption[];
    departments: DepartmentOption[];
    expenseItems: ExpenseItemOption[];
    years: number[];
    request?: {
        search?: string;
        branch_id?: string;
        department_id?: string;
        month?: string;
        year?: string;
    };
};

function formatCurrency(value: string | number | null | undefined): string {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isNaN(amount) ? 0 : amount);
}

function formatBudgetInput(value: string): string {
    const sanitized = value.replace(/[^\d.]/g, '');
    const [integerPart = '', ...decimalParts] = sanitized.split('.');
    const decimalPart = decimalParts.join('').slice(0, 2);
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (decimalParts.length > 0) {
        return `${formattedInteger}.${decimalPart}`;
    }

    return formattedInteger;
}

function parseFormattedNumber(value: string): number {
    const cleaned = value.replace(/,/g, '').trim();
    return Number.parseFloat(cleaned);
}

function getStatusLabel(status: string): string {
    switch (status) {
        case 'approved':
            return 'Approved';
        case 'submitted':
            return 'Pending';
        case 'draft':
        default:
            return 'Pending';
    }
}

function getStatusClassName(status: string): string {
    switch (status) {
        case 'approved':
            return 'border-green-200 bg-green-100 text-green-800 hover:bg-green-100';
        case 'submitted':
            return 'border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100';
        case 'draft':
        default:
            return 'border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100';
    }
}

function buildFilterParams(
    search: string,
    selectedBranch: string,
    selectedDepartment: string,
    selectedMonth: string,
    selectedYear: string,
): Record<string, string> {
    const params: Record<string, string> = {};

    if (search) {
        params.search = search;
    }
    if (selectedBranch !== 'all') {
        params.branch_id = selectedBranch;
    }
    if (selectedDepartment !== 'all') {
        params.department_id = selectedDepartment;
    }
    if (selectedMonth !== 'all') {
        params.month = selectedMonth;
    }
    if (selectedYear !== 'all') {
        params.year = selectedYear;
    }

    return params;
}

function isHeadOfficeBranch(branch: BranchOption | null | undefined): boolean {
    if (!branch) {
        return false;
    }

    if (branch.branch_code?.toUpperCase() === 'HO') {
        return true;
    }

    return branch.name.includes('Head Office');
}

export default function ExpenseBudgetIndex({
    items,
    branches,
    departments,
    expenseItems,
    years,
    request,
}: IndexProps) {
    const { flash } = usePage<{ flash: { message?: string } }>().props;
    const { can } = usePermission();

    const [search, setSearch] = useState<string>(request?.search ?? '');
    const [selectedBranch, setSelectedBranch] = useState<string>(request?.branch_id ?? 'all');
    const [selectedDepartment, setSelectedDepartment] = useState<string>(request?.department_id ?? 'all');
    const [selectedMonth, setSelectedMonth] = useState<string>(request?.month ?? 'all');
    const [selectedYear, setSelectedYear] = useState<string>(request?.year ?? 'all');
    const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
    const [editingItem, setEditingItem] = useState<ExpenseBudgetRow | null>(null);
    const [editForm, setEditForm] = useState<EditFormState | null>(null);
    const [editProcessing, setEditProcessing] = useState(false);
    const [openEditBranch, setOpenEditBranch] = useState(false);
    const [openEditDepartment, setOpenEditDepartment] = useState(false);
    const [openEditExpenseItem, setOpenEditExpenseItem] = useState(false);

    const selectedBranchOption = useMemo(
        () => (selectedBranch === 'all' ? null : branches.find((branch) => branch.id.toString() === selectedBranch) ?? null),
        [selectedBranch, branches],
    );

    const canFilterByDepartment = isHeadOfficeBranch(selectedBranchOption);

    const editBranchOption = useMemo(
        () =>
            editForm?.branch_id
                ? branches.find((branch) => branch.id.toString() === editForm.branch_id) ?? null
                : null,
        [editForm?.branch_id, branches],
    );

    const canEditDepartment = isHeadOfficeBranch(editBranchOption);

    const selectedEditExpenseItem = useMemo(
        () => expenseItems.find((item) => item.id === editForm?.expense_item_id) ?? null,
        [editForm?.expense_item_id, expenseItems],
    );

    useEffect(() => {
        if (flash.message) {
            toast.success(flash.message);
        }
    }, [flash.message]);

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            router.get(
                '/budget/expense-budget',
                buildFilterParams(value, selectedBranch, selectedDepartment, selectedMonth, selectedYear),
                { preserveState: true, replace: true },
            );
        }, 500),
        [selectedBranch, selectedDepartment, selectedMonth, selectedYear],
    );

    function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setSearch(value);
        debouncedSearch(value);
    }

    function applyFilters(
        overrides: Partial<{
            search: string;
            branch: string;
            department: string;
            month: string;
            year: string;
        }> = {},
    ) {
        const params = buildFilterParams(
            overrides.search ?? search,
            overrides.branch ?? selectedBranch,
            overrides.department ?? selectedDepartment,
            overrides.month ?? selectedMonth,
            overrides.year ?? selectedYear,
        );

        router.get('/budget/expense-budget', params, { preserveState: true, replace: true });
    }

    function handleBranchChange(value: string) {
        setSelectedBranch(value);
        setSelectedDepartment('all');
        applyFilters({ branch: value, department: 'all' });
    }

    function handleDepartmentChange(value: string) {
        setSelectedDepartment(value);
        applyFilters({ department: value });
    }

    function handleMonthChange(value: string) {
        setSelectedMonth(value);
        applyFilters({ month: value });
    }

    function handleYearChange(value: string) {
        setSelectedYear(value);
        applyFilters({ year: value });
    }

    function clearFilters() {
        debouncedSearch.cancel();
        setSearch('');
        setSelectedBranch('all');
        setSelectedDepartment('all');
        setSelectedMonth('all');
        setSelectedYear('all');
        router.get('/budget/expense-budget', {}, { preserveState: true, replace: true });
    }

    function confirmDeleteItem() {
        if (deleteItemId === null) {
            return;
        }

        router.delete(`/budget/expense-budget/items/${deleteItemId}`, {
            onSuccess: () => setDeleteItemId(null),
        });
    }

    function openEditDialog(item: ExpenseBudgetRow) {
        setEditingItem(item);
        setEditForm({
            month: item.month,
            year: item.year,
            branch_id: String(item.branch_id),
            department_id: item.department_id ? String(item.department_id) : '',
            expense_item_id: item.expense_item_id,
            planned_budget: formatCurrency(item.planned_budget),
            status: item.status as EditFormState['status'],
        });
        setOpenEditBranch(false);
        setOpenEditDepartment(false);
        setOpenEditExpenseItem(false);
    }

    function closeEditDialog() {
        setEditingItem(null);
        setEditForm(null);
        setOpenEditBranch(false);
        setOpenEditDepartment(false);
        setOpenEditExpenseItem(false);
    }

    function handleEditBranchSelect(branch: BranchOption) {
        if (!editForm) {
            return;
        }

        const headOffice = isHeadOfficeBranch(branch);

        setEditForm({
            ...editForm,
            branch_id: String(branch.id),
            department_id: headOffice ? editForm.department_id : '',
        });
        setOpenEditBranch(false);
    }

    function handleEditDepartmentSelect(department: DepartmentOption) {
        if (!editForm) {
            return;
        }

        setEditForm({
            ...editForm,
            department_id: String(department.id),
        });
        setOpenEditDepartment(false);
    }

    function submitEditItem(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editingItem || !editForm) {
            return;
        }

        if (canEditDepartment && !editForm.department_id) {
            toast.error('The department field is required when the selected branch is Head Office.');
            return;
        }

        const parsedBudget = parseFormattedNumber(editForm.planned_budget);
        if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
            toast.error('Please enter a valid planned budget.');
            return;
        }

        setEditProcessing(true);

        router.patch(
            `/budget/expense-budget/items/${editingItem.id}`,
            {
                month: editForm.month,
                year: editForm.year,
                branch_id: editForm.branch_id,
                department_id: canEditDepartment ? editForm.department_id : null,
                expense_item_id: editForm.expense_item_id,
                planned_budget: parsedBudget,
                status: editForm.status,
            },
            {
                preserveScroll: true,
                onSuccess: () => closeEditDialog(),
                onFinish: () => setEditProcessing(false),
            },
        );
    }

    const hasActiveFilters =
        search !== '' ||
        selectedBranch !== 'all' ||
        selectedDepartment !== 'all' ||
        selectedMonth !== 'all' ||
        selectedYear !== 'all';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="View Expense Budget" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="size-4 text-muted-foreground" />
                            Filters
                        </CardTitle>
                        <div className="flex flex-wrap items-end gap-3 pt-2">
                            <Input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Search by expense item"
                                className="max-w-xs"
                            />
                            <div className="flex flex-wrap gap-2">
                                <Select value={selectedBranch} onValueChange={handleBranchChange}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All Branches" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={selectedDepartment}
                                    onValueChange={handleDepartmentChange}
                                    disabled={!canFilterByDepartment}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem key={department.id} value={department.id.toString()}>
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedMonth} onValueChange={handleMonthChange}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="All Months" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Months</SelectItem>
                                        {ETHIOPIAN_FISCAL_MONTHS.map((month) => (
                                            <SelectItem key={month.value} value={month.value.toString()}>
                                                {month.am}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedYear} onValueChange={handleYearChange}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="All Years" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {hasActiveFilters && (
                                    <Button type="button" variant="secondary" onClick={clearFilters}>
                                        <X className="mr-1 size-4" />
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <hr />
                    <CardContent>
                        <Table>
                            <TableHeader className="bg-slate-500 dark:bg-slate-700">
                                <TableRow>
                                    <TableHead className="font-bold text-white">Month</TableHead>
                                    <TableHead className="font-bold text-white">Year</TableHead>
                                    <TableHead className="font-bold text-white">Branch</TableHead>
                                    <TableHead className="font-bold text-white">Department</TableHead>
                                    <TableHead className="font-bold text-white">Expense Item</TableHead>
                                    <TableHead className="font-bold text-white">Planned Budget</TableHead>
                                    <TableHead className="font-bold text-white">Actual Budget</TableHead>
                                    <TableHead className="font-bold text-white">Status</TableHead>
                                    <TableHead className="font-bold text-white">Submitted By</TableHead>
                                    <TableHead className="font-bold text-white">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.data.map((item) => (
                                    <TableRow key={item.id} className="odd:bg-slate-100 dark:odd:bg-slate-800">
                                        <TableCell>{ETHIOPIAN_FISCAL_MONTHS.find((month) => month.value === item.month)?.am ?? item.month}</TableCell>
                                        <TableCell>{item.year}</TableCell>
                                        <TableCell>{item.branch ?? 'N/A'}</TableCell>
                                        <TableCell>{item.department ?? '-'}</TableCell>
                                        <TableCell>{item.expense_item ?? 'N/A'}</TableCell>
                                        <TableCell>{formatCurrency(item.planned_budget)}</TableCell>
                                        <TableCell>{formatCurrency(item.actual_budget)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(getStatusClassName(item.status))}>
                                                {getStatusLabel(item.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.submitted_by ?? 'N/A'}</TableCell>
                                        <TableCell>
                                            {can('manage expense budgets') && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditDialog(item)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        className="m-2"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setDeleteItemId(item.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    {items.data.length > 0 ? (
                        <TablePagination total={items.total} from={items.from} to={items.to} links={items.links} />
                    ) : (
                        <div className="flex h-full items-center justify-center py-8">No Results Found!</div>
                    )}
                </Card>
            </div>

            <Dialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="size-5" />
                            Delete Expense Budget Item
                        </DialogTitle>
                        <DialogDescription className="pt-1">
                            Are you sure you want to delete this expense budget row? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-2">
                        <Button variant="ghost" onClick={() => setDeleteItemId(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteItem}>
                            <Trash2 className="size-4 mr-1.5" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editingItem !== null} onOpenChange={(open) => !open && closeEditDialog()}>
                <DialogContent
                    className="overflow-visible sm:max-w-2xl"
                    onInteractOutside={(event) => {
                        const target = event.target as HTMLElement | null;

                        if (target?.closest('[data-radix-popper-content-wrapper], [data-radix-popover-content]')) {
                            event.preventDefault();
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Edit Expense Budget Item</DialogTitle>
                        <DialogDescription>
                            Update expense budget details for this row.
                        </DialogDescription>
                    </DialogHeader>
                    {editForm && (
                        <form className="space-y-4" onSubmit={submitEditItem}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-month">
                                        Month <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={String(editForm.month)}
                                        onValueChange={(value) =>
                                            setEditForm({ ...editForm, month: parseInt(value, 10) })
                                        }
                                    >
                                        <SelectTrigger id="edit-month">
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ETHIOPIAN_FISCAL_MONTHS.map((month) => (
                                                <SelectItem key={month.value} value={String(month.value)}>
                                                    {month.am}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-year">
                                        Year <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="edit-year"
                                        type="number"
                                        min={1990}
                                        max={2100}
                                        value={editForm.year}
                                        onChange={(event) =>
                                            setEditForm({
                                                ...editForm,
                                                year: parseInt(event.target.value, 10) || editForm.year,
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Branch <span className="text-red-500">*</span>
                                    </Label>
                                    <Popover modal={false} open={openEditBranch} onOpenChange={setOpenEditBranch}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between font-normal"
                                            >
                                                {editBranchOption?.name ?? 'Select branch...'}
                                                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            portalled={false}
                                            className="z-[100] w-[var(--radix-popover-trigger-width)] p-0"
                                            align="start"
                                        >
                                            <Command>
                                                <CommandInput placeholder="Search branches..." />
                                                <CommandList className="max-h-60">
                                                    <CommandEmpty>No branches found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {branches.map((branch) => (
                                                            <CommandItem
                                                                key={branch.id}
                                                                value={branch.name}
                                                                className="cursor-pointer"
                                                                onSelect={() => handleEditBranchSelect(branch)}
                                                                onClick={() => handleEditBranchSelect(branch)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 size-4',
                                                                        editForm.branch_id === String(branch.id)
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                                {branch.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Department {canEditDepartment && <span className="text-red-500">*</span>}
                                    </Label>
                                    <Popover modal={false} open={openEditDepartment} onOpenChange={setOpenEditDepartment}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between font-normal"
                                                disabled={!canEditDepartment}
                                            >
                                                {editForm.department_id
                                                    ? departments.find(
                                                          (department) =>
                                                              department.id.toString() === editForm.department_id,
                                                      )?.name
                                                    : 'Select Department'}
                                                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            portalled={false}
                                            className="z-[100] w-[var(--radix-popover-trigger-width)] p-0"
                                            align="start"
                                        >
                                            <Command>
                                                <CommandInput placeholder="Search departments..." />
                                                <CommandList className="max-h-60">
                                                    <CommandEmpty>No departments found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {departments.map((department) => (
                                                            <CommandItem
                                                                key={department.id}
                                                                value={department.name}
                                                                className="cursor-pointer"
                                                                onSelect={() => handleEditDepartmentSelect(department)}
                                                                onClick={() => handleEditDepartmentSelect(department)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 size-4',
                                                                        editForm.department_id === String(department.id)
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                                {department.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Expense Item <span className="text-red-500">*</span>
                                    </Label>
                                    <Popover modal={false} open={openEditExpenseItem} onOpenChange={setOpenEditExpenseItem}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between font-normal"
                                            >
                                                {selectedEditExpenseItem?.name ?? 'Select expense item...'}
                                                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            portalled={false}
                                            className="z-[100] w-[var(--radix-popover-trigger-width)] p-0"
                                            align="start"
                                        >
                                            <Command>
                                                <CommandInput placeholder="Search expense items..." />
                                                <CommandList className="max-h-60">
                                                    <CommandEmpty>No expense items found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {expenseItems.map((expenseItem) => (
                                                            <CommandItem
                                                                key={expenseItem.id}
                                                                value={expenseItem.name}
                                                                className="cursor-pointer"
                                                                onSelect={() => {
                                                                    setEditForm({
                                                                        ...editForm,
                                                                        expense_item_id: expenseItem.id,
                                                                    });
                                                                    setOpenEditExpenseItem(false);
                                                                }}
                                                                onClick={() => {
                                                                    setEditForm({
                                                                        ...editForm,
                                                                        expense_item_id: expenseItem.id,
                                                                    });
                                                                    setOpenEditExpenseItem(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 size-4',
                                                                        editForm.expense_item_id === expenseItem.id
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                                {expenseItem.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-planned-budget">
                                        Planned Budget <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="edit-planned-budget"
                                        value={editForm.planned_budget}
                                        onChange={(event) =>
                                            setEditForm({
                                                ...editForm,
                                                planned_budget: formatBudgetInput(event.target.value),
                                            })
                                        }
                                        placeholder="Enter planned budget"
                                        inputMode="decimal"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-1">
                                    <Label htmlFor="edit-status">
                                        Status <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={editForm.status}
                                        onValueChange={(value) =>
                                            setEditForm({
                                                ...editForm,
                                                status: value as EditFormState['status'],
                                            })
                                        }
                                    >
                                        <SelectTrigger id="edit-status" className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={editProcessing}>
                                    {editProcessing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

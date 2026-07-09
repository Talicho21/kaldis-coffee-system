import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Check, ChevronsUpDown, FileText, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Weekly Budgets', href: '/budget/weekly-budget' },
	{ title: 'Add New Budget', href: '/budget/weekly-budget/create' },
];

type BranchOption = {
	id: number;
	name: string;
	branch_code: string;
};

type DepartmentOption = {
	id: number;
	name: string;
};

type FiscalYearOption = {
	id: number;
	name: string;
};

type FiscalMonthOption = {
	id: number;
	name: string;
	fiscal_year_id: number;
};

type WeekOption = {
	weekNumber: number;
	startDate: string; // YYYY-MM-DD
	endDate: string; // YYYY-MM-DD
	label: string;
	disabled: boolean;
};

type CreateProps = {
	branches: BranchOption[];
	departments: DepartmentOption[];
	fiscalYears: FiscalYearOption[];
	fiscalMonths: FiscalMonthOption[];
	today: string; // Gregorian date from server, e.g. "2026-07-09"
};

function isHeadOfficeBranch(branch: BranchOption | null): boolean {
	if (!branch) {
		return false;
	}

	if (branch.branch_code?.toUpperCase() === 'HO') {
		return true;
	}

	return branch.name.includes('Head Office');
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

	if (cleaned === '' || cleaned === '.') {
		return Number.NaN;
	}

	return Number.parseFloat(cleaned);
}

/**
 * Returns the Monday of the week containing the given date.
 */
function getMondayOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
	const diff = day === 0 ? -6 : 1 - day; // offset to Monday
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Returns the ISO week number for a given date.
 */
function getISOWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7; // Make Sunday = 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Set to nearest Thursday
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Format a Date to YYYY-MM-DD
 */
function toDateString(d: Date): string {
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format a Date to DD/MM
 */
function toShortDate(d: Date): string {
	return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Build the week option for a given Monday.
 */
function buildWeekOption(monday: Date, isDisabled: boolean): WeekOption {
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	const weekNumber = getISOWeekNumber(monday);

	return {
		weekNumber,
		startDate: toDateString(monday),
		endDate: toDateString(sunday),
		label: `Week ${weekNumber} (${toShortDate(monday)} – ${toShortDate(sunday)})`,
		disabled: isDisabled,
	};
}

/**
 * Get available week options based on request type and today's date.
 *
 * Urgent: current week, selectable only Mon–Thu (day of week 1–4)
 * Normal: next week, selectable only Mon–Thu of the current week
 *
 * After Thursday, the option is disabled.
 */
function getWeekOptions(requestType: string, todayStr: string): WeekOption[] {
	if (!requestType) {
		return [];
	}

	const today = new Date(todayStr + 'T00:00:00');
	const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat
	const isPastThursday = dayOfWeek === 0 || dayOfWeek >= 5; // Fri, Sat, or Sun

	const currentMonday = getMondayOfWeek(today);

	if (requestType === 'urgent') {
		// Show current week, disable after Thursday
		return [buildWeekOption(currentMonday, isPastThursday)];
	}

	if (requestType === 'normal') {
		// Show next week, disable after Thursday of current week
		const nextMonday = new Date(currentMonday);
		nextMonday.setDate(currentMonday.getDate() + 7);
		return [buildWeekOption(nextMonday, isPastThursday)];
	}

	return [];
}

export default function CreateWeeklyBudget({ branches, departments, fiscalYears, fiscalMonths, today }: CreateProps) {
	const { data, setData, post, processing, errors, clearErrors, setError, transform } = useForm({
		request_type: '',
		branch_id: '',
		department_id: '',
		fiscal_year_id: '',
		fiscal_month_id: '',
		week_number: '',
		week_start_date: '',
		week_end_date: '',
		amount: '',
		description: '',
	});

	const [openBranch, setOpenBranch] = useState(false);
	const [openDepartment, setOpenDepartment] = useState(false);
	const [selectedBranch, setSelectedBranch] = useState<BranchOption | null>(null);
	const [selectedDepartment, setSelectedDepartment] = useState<DepartmentOption | null>(null);

	const isHeadOffice = isHeadOfficeBranch(selectedBranch);

	const filteredFiscalMonths = useMemo(() => {
		if (!data.fiscal_year_id) {
			return fiscalMonths;
		}
		return fiscalMonths.filter((m) => String(m.fiscal_year_id) === data.fiscal_year_id);
	}, [data.fiscal_year_id, fiscalMonths]);

	const weekOptions = useMemo(() => {
		if (!data.request_type || !data.fiscal_month_id) {
			return [];
		}
		return getWeekOptions(data.request_type, today);
	}, [data.request_type, data.fiscal_month_id, today]);

	// Reset week selection when request_type or fiscal_month changes
	useEffect(() => {
		setData((prev) => ({
			...prev,
			week_number: '',
			week_start_date: '',
			week_end_date: '',
		}));
	}, [data.request_type, data.fiscal_month_id]);

	function handleBranchSelect(branch: BranchOption) {
		setSelectedBranch(branch);
		setSelectedDepartment(null);
		setData({
			...data,
			branch_id: String(branch.id),
			department_id: '',
		});
		setOpenBranch(false);
	}

	function handleDepartmentSelect(department: DepartmentOption) {
		setSelectedDepartment(department);
		setData('department_id', String(department.id));
		setOpenDepartment(false);
	}

	function handleWeekSelect(value: string) {
		const week = weekOptions.find((w) => String(w.weekNumber) === value);
		if (week) {
			setData({
				...data,
				week_number: String(week.weekNumber),
				week_start_date: week.startDate,
				week_end_date: week.endDate,
			});
		}
	}

	function handleAmountChange(value: string) {
		setData('amount', formatBudgetInput(value));
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		clearErrors();

		if (!data.request_type) {
			setError('request_type', 'The request type field is required.');
			return;
		}

		if (!data.branch_id) {
			setError('branch_id', 'The branch field is required.');
			return;
		}

		if (isHeadOffice && !data.department_id) {
			setError('department_id', 'The department field is required when the selected branch is Head Office.');
			return;
		}

		if (!data.fiscal_year_id) {
			setError('fiscal_year_id', 'The fiscal year field is required.');
			return;
		}

		if (!data.fiscal_month_id) {
			setError('fiscal_month_id', 'The fiscal month field is required.');
			return;
		}

		if (!data.week_number) {
			setError('week_number', 'The budget week date field is required.');
			return;
		}

		const parsedAmount = parseFormattedNumber(data.amount);
		if (!data.amount || Number.isNaN(parsedAmount) || parsedAmount < 0) {
			setError('amount', 'Please enter a valid amount.');
			return;
		}

		transform((formData) => ({
			...formData,
			amount: parseFormattedNumber(formData.amount),
			department_id: isHeadOffice ? formData.department_id : null,
		}));

		post('/budget/weekly-budget', {
			preserveScroll: true,
			onSuccess: (page) => {
				const message = (page.props as { flash?: { message?: string } }).flash?.message;
				if (message) {
					toast.success(message);
				}
			},
		});
	}

	function handleCancel() {
		router.visit('/budget/weekly-budget');
	}

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="New Budget" />

			<div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
				<Card className="border shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between border-b pb-4">
						<CardTitle className="flex items-center gap-2 text-lg font-semibold">
							<FileText className="size-5 text-muted-foreground" />
							Submit Weekly Budget
						</CardTitle>
						<Button variant="outline" asChild className="shrink-0">
							<Link href="/budget/weekly-budget">Back to list</Link>
						</Button>
					</CardHeader>

					<CardContent className="pt-6">
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
								{/* Request Type */}
								<div className="space-y-2">
									<Label htmlFor="request_type">
										Request Type <span className="text-red-500">*</span>
									</Label>
									<Select
										value={data.request_type}
										onValueChange={(value) =>
											setData({
												...data,
												request_type: value,
												week_number: '',
												week_start_date: '',
												week_end_date: '',
											})
										}
									>
										<SelectTrigger id="request_type">
											<SelectValue placeholder="Select request type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="urgent">Urgent</SelectItem>
											<SelectItem value="normal">Normal</SelectItem>
										</SelectContent>
									</Select>
									<InputError message={errors.request_type} />
								</div>

								{/* Branch */}
								<div className="space-y-2">
									<Label>
										Branch <span className="text-red-500">*</span>
									</Label>
									<Popover open={openBranch} onOpenChange={setOpenBranch}>
										<PopoverTrigger asChild>
											<Button variant="outline" role="combobox" className="w-full justify-between font-normal">
												{selectedBranch ? selectedBranch.name : 'Select branch...'}
												<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
											<Command>
												<CommandInput placeholder="Search branches..." />
												<CommandList className="max-h-60">
													<CommandEmpty>No branches found.</CommandEmpty>
													<CommandGroup>
														{branches.map((branch) => (
															<CommandItem
																key={branch.id}
																value={branch.name}
																onSelect={() => handleBranchSelect(branch)}
															>
																<Check
																	className={cn(
																		'mr-2 size-4',
																		data.branch_id === String(branch.id) ? 'opacity-100' : 'opacity-0',
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
									<InputError message={errors.branch_id} />
								</div>

								{/* Department */}
								<div className="space-y-2">
									<Label>Department {isHeadOffice && <span className="text-red-500">*</span>}</Label>
									<Popover open={openDepartment} onOpenChange={setOpenDepartment}>
										<div className={cn(!isHeadOffice && 'cursor-not-allowed')}>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													role="combobox"
													className="w-full justify-between font-normal"
													disabled={!isHeadOffice}
												>
													{selectedDepartment ? selectedDepartment.name : 'Select Department'}
													<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
												</Button>
											</PopoverTrigger>
										</div>
										<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
											<Command>
												<CommandInput placeholder="Search departments..." />
												<CommandList className="max-h-60">
													<CommandEmpty>No departments found.</CommandEmpty>
													<CommandGroup>
														{departments.map((department) => (
															<CommandItem
																key={department.id}
																value={department.name}
																onSelect={() => handleDepartmentSelect(department)}
															>
																<Check
																	className={cn(
																		'mr-2 size-4',
																		data.department_id === String(department.id) ? 'opacity-100' : 'opacity-0',
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
									<InputError message={errors.department_id} />
								</div>

								{/* Fiscal Year */}
								<div className="space-y-2">
									<Label htmlFor="fiscal_year_id">
										Fiscal Year <span className="text-red-500">*</span>
									</Label>
									<Select
										value={data.fiscal_year_id}
										onValueChange={(value) =>
											setData({
												...data,
												fiscal_year_id: value,
												fiscal_month_id: '',
											})
										}
									>
										<SelectTrigger id="fiscal_year_id">
											<SelectValue placeholder="Select fiscal year" />
										</SelectTrigger>
										<SelectContent>
											{fiscalYears.map((year) => (
												<SelectItem key={year.id} value={String(year.id)}>
													{year.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<InputError message={errors.fiscal_year_id} />
								</div>

								{/* Fiscal Month */}
								<div className="space-y-2">
									<Label htmlFor="fiscal_month_id">
										Fiscal Month <span className="text-red-500">*</span>
									</Label>
									<Select
										value={data.fiscal_month_id}
										onValueChange={(value) => setData('fiscal_month_id', value)}
										disabled={!data.fiscal_year_id}
									>
										<SelectTrigger id="fiscal_month_id">
											<SelectValue placeholder={data.fiscal_year_id ? 'Select fiscal month' : 'Select fiscal year first'} />
										</SelectTrigger>
										<SelectContent>
											{filteredFiscalMonths.map((month) => (
												<SelectItem key={month.id} value={String(month.id)}>
													{month.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<InputError message={errors.fiscal_month_id} />
								</div>

								{/* Budget Week Date Picker */}
								<div className="space-y-2">
									<Label htmlFor="week_date_picker">
										Budget Week Date <span className="text-red-500">*</span>
									</Label>
									<div
										className={cn(
											(!data.request_type || !data.fiscal_month_id || weekOptions.length === 0 || weekOptions[0].disabled) &&
												'cursor-not-allowed',
										)}
									>
										<Input
											id="week_date_picker"
											type="date"
											min={weekOptions.length > 0 ? weekOptions[0].startDate : undefined}
											max={weekOptions.length > 0 ? weekOptions[0].endDate : undefined}
											disabled={
												!data.request_type || !data.fiscal_month_id || weekOptions.length === 0 || weekOptions[0].disabled
											}
											value={data.week_start_date ? data.week_start_date : ''}
											onChange={(e) => {
												const selectedDateStr = e.target.value;
												if (!selectedDateStr) {
													setData({
														...data,
														week_number: '',
														week_start_date: '',
														week_end_date: '',
													});
													return;
												}

												// Ensure the date is valid and get its week info
												const dateObj = new Date(selectedDateStr);
												if (!isNaN(dateObj.getTime())) {
													const monday = getMondayOfWeek(dateObj);
													const sunday = new Date(monday);
													sunday.setDate(monday.getDate() + 6);

													setData({
														...data,
														week_number: String(getISOWeekNumber(dateObj)),
														week_start_date: toDateString(monday),
														week_end_date: toDateString(sunday),
													});
												}
											}}
											className="w-full"
										/>
									</div>
									{!data.request_type ? (
										<p className="text-xs text-slate-500">Please select a request type first.</p>
									) : !data.fiscal_month_id ? (
										<p className="text-xs text-slate-500">Please select a fiscal month first.</p>
									) : weekOptions.length > 0 && weekOptions[0].disabled ? (
										<p className="text-xs text-amber-600">The submission deadline (Thursday) for this week has passed.</p>
									) : null}
									{data.week_number && (
										<p className="text-xs text-slate-500">
											Selected: Week {data.week_number} ({toShortDate(new Date(data.week_start_date))} -{' '}
											{toShortDate(new Date(data.week_end_date))})
										</p>
									)}
									<InputError message={errors.week_number} />
									<InputError message={errors.week_start_date} />
									<InputError message={errors.week_end_date} />
								</div>

								{/* Amount */}
								<div className="space-y-2">
									<Label htmlFor="amount">
										Amount (ETB) <span className="text-red-500">*</span>
									</Label>
									<Input
										id="amount"
										type="text"
										inputMode="decimal"
										placeholder="Enter amount"
										value={data.amount}
										onChange={(e) => handleAmountChange(e.target.value)}
										className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
									/>
									<InputError message={errors.amount} />
								</div>

								{/* Description */}
								<div className="space-y-2 md:col-span-1 xl:col-span-2">
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										placeholder="Optional description for this budget request..."
										value={data.description}
										onChange={(e) => setData('description', e.target.value)}
										rows={3}
									/>
									<InputError message={errors.description} />
								</div>
							</div>

							<div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
								<div className="flex items-center gap-3">
									<Button type="button" variant="outline" onClick={handleCancel}>
										Cancel
									</Button>
									<Button type="submit" className="bg-black text-white hover:bg-black/90" disabled={processing}>
										<Save className="mr-2 size-4" />
										Submit Budget
									</Button>
								</div>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}

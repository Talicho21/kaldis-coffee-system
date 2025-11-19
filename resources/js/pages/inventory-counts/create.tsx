import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/user-permissions';
import type { Branch, ChildCategory, Product, InventoryPeriod } from '@/types/inventory-count';

type FiscalYear = {
	id: number;
	name: string;
};

type PageProps = {
	branches: Branch[];
	userBranchId: number | null;
	canManageAllBranches: boolean;
	inventoryPeriods: InventoryPeriod[];
	childCategories: ChildCategory[];
	products: Product[];
};

export default function CreateInventoryCount({ 
	branches = [], 
	userBranchId,
	canManageAllBranches = false,
	inventoryPeriods = [], 
	childCategories = [],
	products = []
}: PageProps) {
	const { can } = usePermission();

	const [branchId, setBranchId] = useState<string>(userBranchId ? String(userBranchId) : '');
	const [inventoryPeriodId, setInventoryPeriodId] = useState<string>('');
	const [childCategoryId, setChildCategoryId] = useState<string>('');
	const [productCounts, setProductCounts] = useState<Record<number, string>>({});

	const filteredProducts = useMemo(() => {
		if (!childCategoryId) return [];
		return products.filter((p) => String(p.child_category_id) === childCategoryId);
	}, [products, childCategoryId]);

	const handleCountChange = (productId: number, value: string) => {
		setProductCounts((prev) => ({
			...prev,
			[productId]: value,
		}));
	};

	function submit(e: React.FormEvent) {
		e.preventDefault();
		
		if (!branchId || !inventoryPeriodId || !childCategoryId) {
			toast.error('Please select branch, inventory period and child category');
			return;
		}

		// Filter only products with counts entered
		const countsToSubmit = Object.entries(productCounts)
			.filter(([_, count]) => count && parseFloat(count) > 0)
			.map(([productId, count]) => ({
				branch_id: Number(branchId),
				inventory_period_id: Number(inventoryPeriodId),
				child_category_id: Number(childCategoryId),
				product_id: Number(productId),
				count: parseFloat(count),
			}));

		if (countsToSubmit.length === 0) {
			toast.error('Please enter at least one product count');
			return;
		}

		router.post(route('inventory-counts.bulk'), { counts: countsToSubmit }, {
			onSuccess: () => {
				toast.success(`${countsToSubmit.length} inventory count(s) created`);
			},
			onError: () => {
				toast.error('Failed to create inventory counts');
			}
		});
	}

	return (
		<AppLayout
			breadcrumbs={[
				{ title: 'Inventory Counts', href: '/inventory-counts' },
				{ title: 'Create', href: '/inventory-counts/create' },
			]}
		>
			<Head title="Create Inventory Count" />
			<div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-2 sm:p-4">
				<Card className="w-full max-w-4xl mx-auto">
					<CardHeader>
						<CardTitle className="text-xl sm:text-2xl">Create Inventory Count</CardTitle>
					</CardHeader>
					<CardContent className="p-4 sm:p-6">
						<form className="space-y-4 sm:space-y-6" onSubmit={submit}>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
								<div className="space-y-2">
									<Label>Branch *</Label>
									<Select value={branchId} onValueChange={(value) => setBranchId(value)} disabled={!canManageAllBranches}>
										<SelectTrigger>
											<SelectValue placeholder="Select branch" />
										</SelectTrigger>
										<SelectContent>
											{branches.map((branch) => (
												<SelectItem key={branch.id} value={String(branch.id)}>
													{branch.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{!canManageAllBranches && userBranchId && (
										<p className="text-sm text-muted-foreground">Restricted to your branch</p>
									)}
								</div>
								<div className="space-y-2">
									<Label>Inventory Period *</Label>
									<Select value={inventoryPeriodId} onValueChange={(value) => setInventoryPeriodId(value)}>
										<SelectTrigger>
											<SelectValue placeholder="Select inventory period" />
										</SelectTrigger>
										<SelectContent>
											{inventoryPeriods.length === 0 ? (
												<div className="p-2 text-sm text-muted-foreground">No active inventory periods available</div>
											) : (
												inventoryPeriods.map((period) => (
													<SelectItem key={period.id} value={String(period.id)}>
														{period.inventory_period_name}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Child Category *</Label>
									<Select
										value={childCategoryId}
										onValueChange={(value) => {
											setChildCategoryId(value);
											setProductCounts({});
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											{childCategories.map((category) => (
												<SelectItem key={category.id} value={String(category.id)}>
													{category.child_name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							{childCategoryId && filteredProducts.length > 0 && (
								<div className="space-y-2 col-span-full">
									<Label className="text-sm sm:text-base">Products - Enter counts for each product:</Label>
									<div className="rounded-md border overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="whitespace-nowrap">Product Name</TableHead>
													<TableHead className="whitespace-nowrap w-[150px] sm:w-[200px]">Count</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredProducts.map((product) => (
													<TableRow key={product.id}>
														<TableCell className="font-medium">
															{product.product_name}
														</TableCell>
														<TableCell>
															<Input
																type="number"
																step="0.01"
																min="0"
																value={productCounts[product.id] || ''}
																onChange={(e) =>
																	handleCountChange(product.id, e.target.value)
																}
																placeholder="0.00"
																className="w-full"
															/>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</div>
							)}

							{childCategoryId && filteredProducts.length === 0 && (
								<div className="col-span-full rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
									No products found for this category. Please add products first.
								</div>
							)}

							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 col-span-full pt-4">
								<Button
									type="submit"
									disabled={!can('create inventory counts') || !branchId || !inventoryPeriodId || !childCategoryId}
									className="w-full sm:w-auto"
								>
									Save All Counts
								</Button>
								<Link href="/inventory-counts" className="w-full sm:w-auto">
									<Button type="button" variant="outline" className="w-full">
										Cancel
									</Button>
								</Link>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}

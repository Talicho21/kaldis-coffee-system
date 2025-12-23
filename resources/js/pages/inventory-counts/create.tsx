import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/user-permissions';
import type { Branch, ChildCategory, Product, InventoryPeriod } from '@/types/inventory-count';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, WifiOff } from 'lucide-react';
import axios from 'axios';
import { useOffline } from '@/hooks/use-offline';
import { offlineInventory } from '@/lib/offlineStorage';

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

type PreviousCount = {
	id: number;
	count: string;
	product_id: number;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type ProductSaveState = {
	state: SaveState;
	error?: string;
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
	const { isOffline } = useOffline();

	const [branchId, setBranchId] = useState<string>(userBranchId ? String(userBranchId) : '');
	const [inventoryPeriodId, setInventoryPeriodId] = useState<string>('');
	const [childCategoryId, setChildCategoryId] = useState<string>('');
	const [productCounts, setProductCounts] = useState<Record<number, string>>({});
	const [previousCounts, setPreviousCounts] = useState<Record<number, PreviousCount>>({});
	const [saveStates, setSaveStates] = useState<Record<number, ProductSaveState>>({});
	const [loadingPrevious, setLoadingPrevious] = useState(false);
	
	const saveTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({});

	const filteredProducts = useMemo(() => {
		if (!childCategoryId) return [];
		return products.filter((p) => String(p.child_category_id) === childCategoryId);
	}, [products, childCategoryId]);

	// Fetch previous counts when category/period/branch changes
	useEffect(() => {
		if (branchId && inventoryPeriodId && childCategoryId) {
			setLoadingPrevious(true);
			axios.get(route('inventory-counts.previous'), {
				params: {
					branch_id: branchId,
					inventory_period_id: inventoryPeriodId,
					child_category_id: childCategoryId,
				}
			})
			.then((response) => {
				const counts = response.data.counts;
				setPreviousCounts(counts);
				
				// Pre-fill product counts with previous values
				const prefilledCounts: Record<number, string> = {};
				Object.values(counts).forEach((count: any) => {
					prefilledCounts[count.product_id] = count.count;
				});
				setProductCounts(prefilledCounts);

				// Show success message if previous counts found
				if (response.data.success && response.data.message) {
					toast.success(response.data.message);
				}
			})
			.catch((error) => {
				console.error('Failed to fetch previous counts:', error);
				const errorMessage = error.response?.data?.message || 'Unable to load previous counts';
				const errorDetails = error.response?.data?.details;
				
				if (errorDetails) {
					toast.error(errorMessage, { description: errorDetails });
				} else {
					toast.error(errorMessage);
				}
			})
			.finally(() => {
				setLoadingPrevious(false);
			});
		} else {
			setPreviousCounts({});
			setProductCounts({});
		}
	}, [branchId, inventoryPeriodId, childCategoryId]);

	// Auto-save function with debouncing (supports offline)
	const autoSaveCount = useCallback((productId: number, value: string) => {
		if (!branchId || !inventoryPeriodId || !childCategoryId || !value || parseFloat(value) < 0) {
			return;
		}

		// Clear existing timeout for this product
		if (saveTimeoutRef.current[productId]) {
			clearTimeout(saveTimeoutRef.current[productId]);
		}

		// Set saving state
		setSaveStates((prev) => ({
			...prev,
			[productId]: { state: 'saving' }
		}));

		// Debounce the save
		saveTimeoutRef.current[productId] = setTimeout(async () => {
			const countData = {
				branch_id: Number(branchId),
				inventory_period_id: Number(inventoryPeriodId),
				child_category_id: Number(childCategoryId),
				product_id: productId,
				count: parseFloat(value),
			};

			if (isOffline) {
				// Save to offline storage
				try {
					await offlineInventory.saveCount(countData);
					setSaveStates((prev) => ({
						...prev,
						[productId]: { state: 'saved' }
					}));
					toast.success('Saved offline - will sync when online', {
						duration: 2000,
					});
					
					// Clear saved state after 2 seconds
					setTimeout(() => {
						setSaveStates((prev) => ({
							...prev,
							[productId]: { state: 'idle' }
						}));
					}, 2000);
				} catch (error: any) {
					setSaveStates((prev) => ({
						...prev,
						[productId]: { state: 'error', error: 'Failed to save offline' }
					}));
					toast.error('Failed to save offline', { duration: 5000 });
				}
			} else {
				// Save to server
				axios.post(route('inventory-counts.auto-save'), countData)
				.then((response) => {
					setSaveStates((prev) => ({
						...prev,
						[productId]: { state: 'saved' }
					}));
					
					// Show success toast for first save or updates
					if (response.data.success && response.data.message) {
						toast.success(response.data.message, {
							duration: 2000,
						});
					}
					
					// Clear saved state after 2 seconds
					setTimeout(() => {
						setSaveStates((prev) => ({
							...prev,
							[productId]: { state: 'idle' }
						}));
					}, 2000);
				})
				.catch((error) => {
					// Get user-friendly error message from server
					const errorMessage = error.response?.data?.message || 
						error.response?.data?.errors?.count?.[0] || 
						'Unable to save count';
					
					const errorDetails = error.response?.data?.details;
					
					// Set error state with message
					setSaveStates((prev) => ({
						...prev,
						[productId]: { state: 'error', error: errorMessage }
					}));

					// Also show toast notification for visibility
					if (errorDetails) {
						toast.error(errorMessage, { 
							description: errorDetails,
							duration: 5000 
						});
					} else {
						toast.error(errorMessage, { duration: 5000 });
					}
				});
			}
		}, 1000); // 1 second debounce
	}, [branchId, inventoryPeriodId, childCategoryId, isOffline]);

	const handleCountChange = (productId: number, value: string) => {
		setProductCounts((prev) => ({
			...prev,
			[productId]: value,
		}));

		// Trigger auto-save
		autoSaveCount(productId, value);
	};

	const getValidationError = (product: Product, value: string): string | null => {
		if (!value || value === '') return null;
		
		const numValue = parseFloat(value);
		if (isNaN(numValue)) return 'Invalid number';
		
		if (product.min_count_threshold !== null && product.min_count_threshold !== undefined) {
			if (numValue < product.min_count_threshold) {
				return `Minimum: ${product.min_count_threshold}`;
			}
		}
		
		if (product.max_count_threshold !== null && product.max_count_threshold !== undefined) {
			if (numValue > product.max_count_threshold) {
				return `Maximum: ${product.max_count_threshold}`;
			}
		}
		
		return null;
	};

	const hasAnyCounts = Object.values(productCounts).some(count => count && parseFloat(count) > 0);

	return (
		<AppLayout
			breadcrumbs={[
				{ title: 'Inventory Counts', href: '/inventory-counts' },
				{ title: 'Create', href: '/inventory-counts/create' },
			]}
		>
			<Head title="Create Inventory Count" />
			<div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-2 sm:p-4">
				<Card className="w-full max-w-6xl mx-auto">
					<CardHeader>
						<CardTitle className="text-xl sm:text-2xl">Create Inventory Count</CardTitle>
						<p className="text-sm text-muted-foreground mt-2">
							Counts are automatically saved as you type. Previous counts will be shown if available.
							{isOffline && (
								<span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 mt-1">
									<WifiOff className="h-3.5 w-3.5" />
									Offline mode: Changes will sync when you're back online
								</span>
							)}
						</p>
					</CardHeader>
					<CardContent className="p-4 sm:p-6">
						<div className="space-y-4 sm:space-y-6">
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
									<div className="flex items-center justify-between">
										<Label className="text-sm sm:text-base">Products - Enter counts for each product:</Label>
										{loadingPrevious && (
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<Loader2 className="h-4 w-4 animate-spin" />
												Loading previous counts...
											</div>
										)}
									</div>
									<div className="rounded-md border overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="whitespace-nowrap">Product Name</TableHead>
													<TableHead className="whitespace-nowrap w-[120px]">Previous</TableHead>
													<TableHead className="whitespace-nowrap w-[200px]">Count</TableHead>
													<TableHead className="whitespace-nowrap w-[100px]">Status</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredProducts.map((product) => {
													const validationError = getValidationError(product, productCounts[product.id] || '');
													const saveState = saveStates[product.id];
													const previousCount = previousCounts[product.id];

													return (
														<TableRow key={product.id} className={validationError ? 'bg-red-50 dark:bg-red-950/20' : ''}>
															<TableCell className="font-medium">
																{product.product_name}
															</TableCell>
															<TableCell>
																{previousCount ? (
																	<Badge variant="secondary" className="font-mono">
																		{previousCount.count}
																	</Badge>
																) : (
																	<span className="text-xs text-muted-foreground">-</span>
																)}
															</TableCell>
															<TableCell>
																<div className="space-y-1">
																	<Input
																		type="number"
																		step="0.01"
																		min="0"
																		value={productCounts[product.id] || ''}
																		onChange={(e) =>
																			handleCountChange(product.id, e.target.value)
																		}
																		placeholder="0.00"
																		className={`w-full ${validationError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
																	/>
																	{validationError && (
																		<p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
																			<AlertCircle className="h-3 w-3" />
																			{validationError}
																		</p>
																	)}
																</div>
															</TableCell>
															<TableCell>
																<div className="flex items-center justify-center">
																	{saveState?.state === 'saving' && (
																		<div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
																			<Loader2 className="h-4 w-4 animate-spin" />
																			<span className="text-xs font-medium">Saving...</span>
																		</div>
																	)}
																	{saveState?.state === 'saved' && (
																		<div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
																			<CheckCircle2 className="h-4 w-4" />
																			<span className="text-xs font-medium">Saved</span>
																		</div>
																	)}
																	{saveState?.state === 'error' && (
																		<div className="flex flex-col items-center gap-1 max-w-[200px]">
																			<div className="flex items-center gap-1">
																				<AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
																				<span className="text-xs text-red-600 dark:text-red-400 font-medium">
																					Failed
																				</span>
																			</div>
																			{saveState.error && (
																				<span className="text-xs text-red-600 dark:text-red-400 text-center leading-tight">
																					{saveState.error}
																				</span>
																			)}
																		</div>
																	)}
																</div>
															</TableCell>
														</TableRow>
													);
												})}
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

							{hasAnyCounts && (
								<Alert className="col-span-full bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
									<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
									<AlertDescription className="text-green-800 dark:text-green-200">
										Your counts are being saved automatically as you type.
									</AlertDescription>
								</Alert>
							)}

							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 col-span-full pt-4">
								<Link href="/inventory-counts" className="w-full sm:w-auto">
									<Button 
										type="button" 
										className="w-full gap-2"
										disabled={!hasAnyCounts}
									>
										Go to Inventory Counts
										<ArrowRight className="h-4 w-4" />
									</Button>
								</Link>
								<Link href="/inventory-counts" className="w-full sm:w-auto">
									<Button type="button" variant="outline" className="w-full">
										Cancel
									</Button>
								</Link>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}

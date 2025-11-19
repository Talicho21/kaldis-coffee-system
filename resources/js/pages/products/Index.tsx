import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermission } from '@/hooks/user-permissions';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

type Product = {
	id: number;
	product_name: string;
	product_code?: string | null;
	unit_price?: number | null;
	status: 'Available' | 'Unavailable';
	child_category_id: number | null;
	child_category?: { id: number; child_name: string };
};

type ChildCategory = {
	id: number;
	child_name: string;
};

type Paginated<T> = {
	data: T[];
	total: number;
	from: number;
	to: number;
	links: any[];
};

type PageProps = {
	products: Paginated<Product>;
	childCategories: ChildCategory[];
	filters: {
		search?: string;
		child_category_id?: string;
		per_page?: number;
	};
};

export default function ProductsIndex({ products, childCategories = [], filters = {} }: PageProps) {
	const [search, setSearch] = useState(filters.search ?? '');
	const [categoryFilter, setCategoryFilter] = useState<string>(filters.child_category_id ?? 'all');
	const { can } = usePermission();

	function handleSearch(e: React.FormEvent) {
		e.preventDefault();
		const params: Record<string, string> = {};
		if (search) params.search = search;
		if (categoryFilter !== 'all') params.child_category_id = categoryFilter;
		
		router.get('/products', params, {
			preserveState: true,
			preserveScroll: true,
		});
	}

	function deleteItem(id: number) {
		if (!confirm('Delete this product?')) return;
		router.delete(route('products.destroy', id), {
			preserveScroll: true,
			onSuccess: () => toast.success('Deleted successfully'),
			onError: () => toast.error('Delete failed'),
		});
	}

	return (
		<AppLayout breadcrumbs={[{ title: 'Products', href: '/products' }]}>
			<Head title="Products" />
			<div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
				<Card>
					<CardHeader className="flex items-center justify-between">
						<CardTitle>Products</CardTitle>
						<form className="ml-4 flex flex-wrap items-center gap-2" onSubmit={handleSearch}>
							<Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger className="w-48">
									<SelectValue placeholder="Filter by category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									{childCategories.map((category) => (
										<SelectItem key={category.id} value={String(category.id)}>
											{category.child_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button type="submit" variant="outline">
								Search
							</Button>
						</form>
						<CardAction>
							{can('create products') && (
								<Link href="/products/create">
									<Button variant="default">Add New</Button>
								</Link>
							)}
						</CardAction>
					</CardHeader>
					<hr />
					<CardContent>
						<Table>
							<TableHeader className="bg-slate-500 dark:bg-slate-700">
								<TableRow>
									<TableHead className="font-bold text-white">#</TableHead>
									<TableHead className="font-bold text-white">Name</TableHead>
									<TableHead className="font-bold text-white">Product Code</TableHead>
									<TableHead className="font-bold text-white">Unit Price</TableHead>
									<TableHead className="font-bold text-white">Status</TableHead>
									<TableHead className="font-bold text-white">Child Category</TableHead>
									<TableHead className="font-bold text-white">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{products.data.map((item, idx) => (
									<TableRow key={item.id} className="odd:bg-slate-100 dark:odd:bg-slate-800">
										<TableCell>{(products.from ?? 0) + idx}</TableCell>
										<TableCell>{item.product_name}</TableCell>
										<TableCell>{item.product_code ?? '-'}</TableCell>
										<TableCell>{item.unit_price ? `${Number(item.unit_price).toFixed(2)}` : '-'}</TableCell>
										<TableCell>
											<Badge variant="outline">{item.status}</Badge>
										</TableCell>
										<TableCell>{item.child_category?.child_name ?? 'N/A'}</TableCell>
										<TableCell>
											{can('update products') && (
												<Link href={`/products/${item.id}/edit`}>
													<Button variant="outline" size="sm">
														Edit
													</Button>
												</Link>
											)}
											{can('delete products') && (
												<Button className="m-2" variant="destructive" size="sm" onClick={() => deleteItem(item.id)}>
													Delete
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
								{products.data.length === 0 && (
									<TableRow>
										<TableCell colSpan={7}>No Results Found!</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
					<TablePagination
						from={products.from}
						to={products.to}
						total={products.total}
						links={products.links}
					/>
				</Card>
			</div>
		</AppLayout>
	);
}

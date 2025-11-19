import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { usePermission } from '@/hooks/user-permissions';

type ChildCategory = { id: number; child_name: string };
type Product = {
	id: number;
	product_name: string;
	product_code?: string | null;
	unit_price?: number | null;
	status: 'Available' | 'Unavailable';
	child_category_id: number;
};

type PageProps = {
	product: Product;
	childCategories: ChildCategory[];
};

export default function EditProduct({ product, childCategories = [] }: PageProps) {
	const { can } = usePermission();

	const [productName, setProductName] = useState(product.product_name);
	const [productCode, setProductCode] = useState(product.product_code ?? '');
	const [unitPrice, setUnitPrice] = useState(product.unit_price ? String(product.unit_price) : '');
	const [status, setStatus] = useState<'Available' | 'Unavailable'>(product.status);
	const [childCategoryId, setChildCategoryId] = useState<string>(String(product.child_category_id));

	function save(e: React.FormEvent) {
		e.preventDefault();
		router.put(route('products.update', product.id), {
			product_name: productName,
			product_code: productCode || null,
			unit_price: unitPrice ? Number(unitPrice) : null,
			status,
			child_category_id: Number(childCategoryId),
		});
	}

	return (
		<AppLayout breadcrumbs={[{ title: 'Products', href: '/products' }, { title: 'Edit', href: `/products/${product.id}/edit` }]}>
			<Head title="Edit Product" />
			<div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
				<Card>
					<CardHeader>
						<CardTitle>Edit Product</CardTitle>
					</CardHeader>
					<CardContent>
						<form className="grid max-w-xl gap-4" onSubmit={save}>
								<div className="grid gap-2">
									<Label htmlFor="product_name">Name</Label>
									<Input id="product_name" value={productName} onChange={(e) => setProductName(e.target.value)} required maxLength={100} />
								</div>
								<div className="grid gap-2">
									<Label htmlFor="product_code">Product Code</Label>
									<Input id="product_code" value={productCode} onChange={(e) => setProductCode(e.target.value)} maxLength={50} />
								</div>
								<div className="grid gap-2">
									<Label htmlFor="unit_price">Unit Price</Label>
									<Input id="unit_price" type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
								</div>
								<div className="grid gap-2">
									<Label>Status</Label>
									<Select value={status} onValueChange={(v) => setStatus(v as 'Available' | 'Unavailable')}>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Available">Available</SelectItem>
											<SelectItem value="Unavailable">Unavailable</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<Label>Child Category *</Label>
									<Select value={childCategoryId} onValueChange={(v) => setChildCategoryId(v)}>
										<SelectTrigger>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											{childCategories.map((c) => (
												<SelectItem key={c.id} value={String(c.id)}>{c.child_name}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-center gap-2">
									<Button type="submit" disabled={!can('update products') || !childCategoryId}>Save</Button>
									<Link href="/products">
										<Button type="button" variant="outline">Back</Button>
									</Link>
								</div>
							</form>
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}



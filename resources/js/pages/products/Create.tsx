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

type PageProps = {
	childCategories: ChildCategory[];
};

export default function CreateProduct({ childCategories = [] }: PageProps) {
	const { can } = usePermission();
	const [productName, setProductName] = useState('');
	const [productCode, setProductCode] = useState('');
	const [unitPrice, setUnitPrice] = useState('');
	const [status, setStatus] = useState<'Available' | 'Unavailable'>('Available');
	const [childCategoryId, setChildCategoryId] = useState<string>('');

	function submit(e: React.FormEvent) {
		e.preventDefault();
		router.post(route('products.store'), {
			product_name: productName,
			product_code: productCode || null,
			unit_price: unitPrice ? Number(unitPrice) : null,
			status,
			child_category_id: Number(childCategoryId),
		});
	}

	return (
		<AppLayout breadcrumbs={[{ title: 'Products', href: '/products' }, { title: 'Create', href: '/products/create' }]}>
			<Head title="Create Product" />
			<div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
				<Card>
					<CardHeader>
						<CardTitle>Create Product</CardTitle>
					</CardHeader>
					<CardContent>
						<form className="grid max-w-xl gap-4" onSubmit={submit}>
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
								<Button type="submit" disabled={!can('create products') || !childCategoryId}>Save</Button>
								<Link href="/products">
									<Button type="button" variant="outline">Cancel</Button>
								</Link>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}



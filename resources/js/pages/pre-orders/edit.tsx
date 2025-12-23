import { type BreadcrumbItem } from '@/types';
import { type PreOrder, type PreOrderProduct, type OrderType, type CollectionDay } from '@/types/pre-order';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';

import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pre-Orders', href: '/pre-orders' },
    { title: 'Edit Order', href: '#' },
];

type Props = {
    preOrder: PreOrder;
    branches: Array<{ id: number; name: string }>;
    collectionDays: CollectionDay[];
    orderTypes: OrderType[];
    products: PreOrderProduct[];
    isRegisteringUser: boolean;
};

type OrderItem = {
    product_id: number;
    quantity: number;
};

export default function Edit({ preOrder, branches, collectionDays, orderTypes, products, isRegisteringUser }: Props) {
    const { data, setData, put, processing, errors } = useForm<{
        client_name: string;
        phone_number: string;
        order_type_id: string;
        collection_day_id: string;
        collection_branch_id: string;
        voucher_code?: string;
        transaction_reference?: string;
        status: string;
        items: OrderItem[];
    }>({
        client_name: preOrder.client_name,
        phone_number: preOrder.phone_number.startsWith('+251') 
            ? preOrder.phone_number.substring(4) // Remove +251 prefix
            : preOrder.phone_number,
        order_type_id: preOrder.order_type_id.toString(),
        collection_day_id: preOrder.collection_day_id.toString(),
        collection_branch_id: preOrder.collection_branch_id.toString(),
        voucher_code: preOrder.voucher_code || '',
        transaction_reference: preOrder.transaction_reference || '',
        status: preOrder.status,
        items: preOrder.items?.map((item) => ({
            product_id: item.pre_order_product_id,
            quantity: item.quantity,
        })) || [],
    });

    // Initialize quantities from existing order items
    const productQuantities = useMemo(() => {
        const quantities: Record<number, number> = {};
        products.forEach((product) => {
            quantities[product.id] = 0;
        });
        // Load existing quantities from order items
        data.items.forEach((item) => {
            quantities[item.product_id] = item.quantity;
        });
        return quantities;
    }, [products, data.items]);

    const updateQuantity = (productId: number, quantity: number) => {
        const newQuantity = Math.max(0, quantity);
        const newItems = products
            .map((product) => ({
                product_id: product.id,
                quantity: product.id === productId ? newQuantity : (productQuantities[product.id] || 0),
            }))
            .filter((item) => item.quantity > 0);

        setData('items', newItems);
    };

    // Calculate totals in real-time
    const calculations = useMemo(() => {
        let totalAmount = 0;
        const itemDetails = products.map((product) => {
            const quantity = productQuantities[product.id] || 0;
            const unitPrice = parseFloat(product.unit_price);
            const subtotal = quantity * unitPrice;
            totalAmount += subtotal;

            return {
                productId: product.id,
                productName: product.product_name,
                unitPrice,
                quantity,
                subtotal,
            };
        });

        return { itemDetails, totalAmount };
    }, [products, productQuantities]);

    // Check if current order type is Walkin Customer
    const isWalkinCustomer = useMemo(() => {
        const orderType = orderTypes.find(type => type.id.toString() === data.order_type_id);
        return orderType?.name === 'Walkin Customer';
    }, [data.order_type_id, orderTypes]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('pre-orders.update', preOrder.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Order ${preOrder.order_number}`} />

            <div className="container mx-auto p-6 space-y-6">
                <Heading
                    title={`Edit Order ${preOrder.order_number}`}
                    description="Update pre-order details"
                />

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Customer Information Section */}
                    <div className="rounded-lg border p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Customer Information</h3>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="client_name">Client Full Name *</Label>
                                <Input
                                    id="client_name"
                                    value={data.client_name}
                                    onChange={(e) => setData('client_name', e.target.value)}
                                    required
                                    placeholder="Enter client full name"
                                />
                                <InputError message={errors.client_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone_number">Phone Number *</Label>
                                <div className="flex">
                                    <div className="flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted/50 text-sm font-medium">
                                        +251
                                    </div>
                                    <Input
                                        id="phone_number"
                                        value={data.phone_number}
                                        onChange={(e) => {
                                            // Only allow digits and limit to 9 characters starting with 9 or 7
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value === '' || ((value.startsWith('9') || value.startsWith('7')) && value.length <= 9)) {
                                                setData('phone_number', value);
                                            }
                                        }}
                                        className="rounded-l-none"
                                        maxLength={9}
                                        required
                                        placeholder="912345678 or 712345678"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Enter phone number starting with 9 or 7 (e.g., 912345678 or 712345678)
                                </p>
                                <InputError message={errors.phone_number} />
                            </div>
                        </div>
                    </div>

                    {/* Order Status Section */}
                    <div className="rounded-lg border p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Order Status</h3>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status *</Label>
                            {preOrder.order_type?.name === 'Walkin Customer' ? (
                                <div>
                                    <Input
                                        id="status"
                                        value={data.status}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Status cannot be changed for Walkin Customer orders (already paid)
                                    </p>
                                </div>
                            ) : (
                                <Select
                                    value={data.status}
                                    onValueChange={(value) => setData('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                        <SelectItem value="Collected">Collected</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            <InputError message={errors.status} />
                        </div>
                    </div>

                    {/* Order Details Section */}
                    <div className="rounded-lg border p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Order Details</h3>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="order_type_id">Order Type *</Label>
                                <Select
                                    value={data.order_type_id}
                                    onValueChange={(value) => setData('order_type_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select order type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orderTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.order_type_id} />
                            </div>

                            {isWalkinCustomer ? (
                                <div className="grid gap-2">
                                    <Label htmlFor="voucher_code">
                                        Voucher Code *
                                        {isRegisteringUser && (
                                            <span className="text-sm text-muted-foreground ml-2">
                                                (You cannot edit this field)
                                            </span>
                                        )}
                                    </Label>
                                    <Input
                                        id="voucher_code"
                                        value={data.voucher_code}
                                        onChange={(e) => setData('voucher_code', e.target.value)}
                                        disabled={isRegisteringUser}
                                        placeholder={isRegisteringUser ? "Voucher code (read-only)" : "Enter voucher code"}
                                        className={isRegisteringUser ? "bg-muted" : ""}
                                        required
                                    />
                                    <InputError message={errors.voucher_code} />
                                    {isRegisteringUser && (
                                        <p className="text-xs text-muted-foreground">
                                            As the registering user, you cannot modify the voucher code.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    <Label htmlFor="transaction_reference">Transaction Reference *</Label>
                                    <Input
                                        id="transaction_reference"
                                        value={data.transaction_reference}
                                        onChange={(e) => setData('transaction_reference', e.target.value)}
                                        placeholder="Enter transaction reference"
                                        required
                                    />
                                    <InputError message={errors.transaction_reference} />
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="collection_day_id">Collection Day *</Label>
                                <Select
                                    value={data.collection_day_id}
                                    onValueChange={(value) => setData('collection_day_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select collection day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collectionDays.map((day) => (
                                            <SelectItem key={day.id} value={day.id.toString()}>
                                                {day.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.collection_day_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="collection_branch_id">Collection Branch *</Label>
                                <Select
                                    value={data.collection_branch_id}
                                    onValueChange={(value) => setData('collection_branch_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.collection_branch_id} />
                            </div>
                        </div>

                        {preOrder.registering_branch && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                <Label className="text-sm font-medium">Registering Branch</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {preOrder.registering_branch.name}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Products Section */}
                    <div className="rounded-lg border p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Products *</h3>
                        <p className="text-sm text-muted-foreground">
                            Enter quantity for each product the customer wants to order
                        </p>

                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead className="w-[150px]">Quantity</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                No products available. Please add products in settings first.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        calculations.itemDetails.map((item) => (
                                            <TableRow key={item.productId}>
                                                <TableCell className="font-medium">{item.productName}</TableCell>
                                                <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateQuantity(item.productId, parseInt(e.target.value) || 0)
                                                        }
                                                        className="w-full"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ${item.subtotal.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                    {products.length > 0 && (
                                        <TableRow className="bg-muted/50">
                                            <TableCell colSpan={3} className="text-right font-bold">
                                                Total Amount:
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-lg">
                                                ${calculations.totalAmount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <InputError message={errors.items} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || data.items.length === 0}>
                            Update Pre-Order
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

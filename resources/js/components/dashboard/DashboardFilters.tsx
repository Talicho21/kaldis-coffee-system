import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { FilterX, Calendar, Search } from 'lucide-react';
import { Link, router } from '@inertiajs/react';

interface FiltersProps {
    filters: {
        date_from?: string;
        date_to?: string;
        branch_id?: string;
        product_id?: string;
        collection_day_id?: string;
        status?: string;
        order_type_id?: string;
    };
    branches: Array<{ id: number; name: string }>;
    products: Array<{ id: number; product_name: string }>;
    collectionDays: Array<{ id: number; name: string }>;
    orderTypes: Array<{ id: number; name: string }>;
}

const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Collected', value: 'Collected' },
    { label: 'Cancelled', value: 'Cancelled' },
];

export default function DashboardFilters({ 
    filters, 
    branches, 
    products, 
    collectionDays, 
    orderTypes 
}: FiltersProps) {
    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? '' : value };
        router.get('/pre-orders/dashboard', newFilters, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        router.get('/pre-orders/dashboard', {}, { preserveState: true, replace: true });
    };

    const hasActiveFilters = Object.values(filters).some(value => value);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Filters
                    {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2">
                            Active
                        </Badge>
                    )}
                </CardTitle>
                <div className="flex gap-2">
                    {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                            <FilterX className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {/* Date Range */}
                    <div className="space-y-2">
                        <Label htmlFor="date_from">From Date</Label>
                        <Input
                            id="date_from"
                            type="date"
                            value={filters.date_from || ''}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            placeholder="Start date"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date_to">To Date</Label>
                        <Input
                            id="date_to"
                            type="date"
                            value={filters.date_to || ''}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            placeholder="End date"
                        />
                    </div>

                    {/* Branch Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="branch_id">Branch</Label>
                        <Select value={filters.branch_id || 'all'} onValueChange={(value) => handleFilterChange('branch_id', value)}>
                            <SelectTrigger>
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
                    </div>

                    {/* Product Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="product_id">Product</Label>
                        <Select value={filters.product_id || 'all'} onValueChange={(value) => handleFilterChange('product_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Products" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Products</SelectItem>
                                {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.product_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Collection Day Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="collection_day_id">Collection Day</Label>
                        <Select value={filters.collection_day_id || 'all'} onValueChange={(value) => handleFilterChange('collection_day_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Days" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Days</SelectItem>
                                {collectionDays.map((day) => (
                                    <SelectItem key={day.id} value={day.id.toString()}>
                                        {day.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Order Type Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="order_type_id">Order Type</Label>
                        <Select value={filters.order_type_id || 'all'} onValueChange={(value) => handleFilterChange('order_type_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {orderTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

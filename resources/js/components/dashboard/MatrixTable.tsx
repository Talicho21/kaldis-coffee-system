import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface MatrixTableProps {
    title: string;
    subtitle?: string;
    data: Array<{
        id: number;
        name: string;
        total_orders: number;
        total_revenue: number;
        [key: string]: any;
    }>;
    type: 'branch' | 'product' | 'collection_day';
}

export default function MatrixTable({ title, subtitle, data, type }: MatrixTableProps) {
    const getPerformanceColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600 bg-green-50';
        if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getTrendIcon = (trend: number) => {
        return trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {subtitle && <CardDescription>{subtitle}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">
                                    {type === 'branch' ? 'Branch' : type === 'product' ? 'Product' : 'Collection Day'}
                                </TableHead>
                                <TableHead className="text-right">Orders</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                                <TableHead className="text-right">Avg/Order</TableHead>
                                <TableHead className="text-right">Performance</TableHead>
                                {data[0]?.paid_orders !== undefined && (
                                    <TableHead className="text-right">Paid</TableHead>
                                )}
                                {data[0]?.pending_orders !== undefined && (
                                    <TableHead className="text-right">Pending</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => {
                                const totalOrders = data.reduce((sum, d) => sum + d.total_orders, 0);
                                const performance = ((item.total_orders / Math.max(...data.map(d => d.total_orders))) * 100);
                                const avgOrderValue = item.total_orders > 0 ? item.total_revenue / item.total_orders : 0;
                                
                                return (
                                    <TableRow key={item.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            <div>
                                                <div className="font-semibold">{item.name}</div>
                                                {type === 'product' && item.product_name && (
                                                    <div className="text-sm text-muted-foreground">{item.product_name}</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="text-lg px-3 py-1">
                                                {item.total_orders.toLocaleString()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(item.total_revenue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(avgOrderValue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${getPerformanceColor(performance)}`}>
                                                {getTrendIcon(performance)}
                                                {performance.toFixed(1)}%
                                            </div>
                                        </TableCell>
                                        {item.paid_orders !== undefined && (
                                            <TableCell className="text-right">
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                    {item.paid_orders}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        {item.pending_orders !== undefined && (
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                                                    {item.pending_orders}
                                                </Badge>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                            
                            {/* Total Row */}
                            <TableRow className="font-semibold bg-gray-100">
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right">
                                    {data.reduce((sum, item) => sum + item.total_orders, 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(data.reduce((sum, item) => sum + item.total_revenue, 0))}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(
                                        data.reduce((sum, item) => sum + item.total_revenue, 0) /
                                        Math.max(1, data.reduce((sum, item) => sum + item.total_orders, 0))
                                    )}
                                </TableCell>
                                <TableCell className="text-center" colSpan={
                                    (data[0]?.paid_orders !== undefined ? 1 : 0) + 
                                    (data[0]?.pending_orders !== undefined ? 1 : 0) + 1
                                }>
                                    —
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

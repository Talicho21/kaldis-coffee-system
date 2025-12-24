
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Bar,
    BarChart,
    Sector,
    CartesianGrid,
    Cell,
    LabelList,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

interface DashboardChartsProps {
    data: {
        orderType: Array<{ name: string; value: number }>;
        product: Array<{ product_name: string; total_quantity: number; total_revenue: number }>;
        collectionDay: Array<{ collection_day: { name: string }; metrics: { total_orders: number } }>;
    };
}

// Very Light Pastel Color Palette - Matching Summary Cards bg-*-50 aesthetic
const COLORS = [
    '#93C5FD', // Very Light Blue (blue-300)
    '#6EE7B7', // Very Light Emerald (emerald-300)
    '#C4B5FD', // Very Light Purple (violet-300)
    '#F9A8D4', // Very Light Pink (pink-300)
    '#FCD34D', // Very Light Amber (amber-300)
    '#7DD3FC', // Very Light Sky Blue (sky-300)
    '#86EFAC', // Very Light Green (green-300)
    '#FDBA74', // Very Light Orange (orange-300)
    '#A5B4FC', // Very Light Indigo (indigo-300)
    '#5EEAD4', // Very Light Teal (teal-300)
];

const BRAND_COLOR = '#93C5FD'; // Very Light Blue for Products chart
const SECONDARY_COLOR = '#6EE7B7'; // Very Light Emerald for Collection Day chart

export default function DashboardCharts({ data }: DashboardChartsProps) {
    const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);

    // Format Collection Day data for chart
    const collectionDayData = data.collectionDay.map(day => ({
        name: day.collection_day.name,
        orders: day.metrics.total_orders,
    }));

    // Custom active shape for pie chart
    const renderActiveShape = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
        return (
            <g>
                <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} fontSize={16} fontWeight="bold">
                    {payload.name}
                </text>
                <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#666" fontSize={14}>
                    {value} orders
                </text>
                <text x={cx} y={cy} dy={35} textAnchor="middle" fill="#999" fontSize={12}>
                    {`${(percent * 100).toFixed(1)}%`}
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 10}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
            </g>
        );
    };

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(undefined);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Order Type Distribution */}
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Order Type Distribution</CardTitle>
                    <CardDescription>Breakdown by order type</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.orderType}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                activeShape={activeIndex !== undefined ? renderActiveShape : undefined}
                                onMouseEnter={onPieEnter}
                                onMouseLeave={onPieLeave}
                                label={activeIndex === undefined ? ({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%` : undefined}
                                style={{ cursor: 'pointer' }}
                                animationBegin={0}
                                animationDuration={800}
                            >
                                {data.orderType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [value, 'Orders']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="flex flex-col md:col-span-2 lg:col-span-1">
                <CardHeader>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>By total quantity sold</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data.product.slice(0, 10)} // Top 10
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="product_name"
                                type="category"
                                width={100}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={(value: any, name: any) => [value, name === 'total_quantity' ? 'Quantity' : name]}
                                labelStyle={{ fontWeight: 'bold' }}
                            />
                            <Bar
                                dataKey="total_quantity"
                                fill={BRAND_COLOR}
                                name="Quantity"
                                radius={[0, 4, 4, 0]}
                                style={{ cursor: 'pointer' }}
                                animationBegin={0}
                                animationDuration={800}
                            >
                                <LabelList dataKey="total_quantity" position="right" fill="#1E40AF" fontSize={12} fontWeight="bold" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Collection Day Volume */}
            <Card className="flex flex-col md:col-span-2 lg:col-span-1">
                <CardHeader>
                    <CardTitle>Collection Day</CardTitle>
                    <CardDescription>Orders by collection day</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={collectionDayData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis hide />
                            <Tooltip />
                            <Bar
                                dataKey="orders"
                                fill={SECONDARY_COLOR}
                                name="Orders"
                                radius={[4, 4, 0, 0]}
                                style={{ cursor: 'pointer' }}
                                animationBegin={0}
                                animationDuration={800}
                            >
                                <LabelList dataKey="orders" position="center" fill="#065F46" fontSize={12} fontWeight="bold" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

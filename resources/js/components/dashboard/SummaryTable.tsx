import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SummaryTableProps {
	data: Array<{
		collectionBranch: string;
		collectionDay: string;
		product: string;
		totalQuantity: number;
		totalAmount: number;
		totalOrders: number;
	}>;
}

export default function SummaryTable({ data }: SummaryTableProps) {
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-ET', {
			style: 'currency',
			currency: 'ETB',
		}).format(amount);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Orders by Collection Branch</CardTitle>
				<CardDescription>Grouped by branch, collection day, and product with quantity and revenue totals</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Collection Branch</TableHead>
								<TableHead>Collection Day</TableHead>
								<TableHead>Product</TableHead>
								<TableHead className="text-right">Total Quantity</TableHead>
								<TableHead className="text-right">Total Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.map((row, index) => (
								<TableRow key={index} className="hover:bg-gray-50">
									<TableCell className="font-medium">
										<Badge variant="secondary" className="bg-blue-100 text-blue-800">
											{row.collectionBranch}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
											{row.collectionDay}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-800">
											{row.product}
										</Badge>
									</TableCell>
									<TableCell className="text-right font-semibold">{row.totalQuantity.toLocaleString()}</TableCell>
									<TableCell className="text-right font-bold text-green-600">{formatCurrency(row.totalAmount)}</TableCell>
								</TableRow>
							))}

							{/* Total Row */}
							<TableRow className="bg-gray-100 font-semibold">
								<TableCell className="font-bold">Grand Total</TableCell>
								<TableCell colSpan={2}></TableCell>
								<TableCell className="text-right">{data.reduce((sum, row) => sum + row.totalQuantity, 0).toLocaleString()}</TableCell>
								<TableCell className="text-right text-green-600">
									{formatCurrency(data.reduce((sum, row) => sum + row.totalAmount, 0))}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

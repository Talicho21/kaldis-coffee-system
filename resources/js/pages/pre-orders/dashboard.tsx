import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

// Components
import SummaryCards from '@/components/dashboard/SummaryCards';
import SummaryTable from '@/components/dashboard/SummaryTable';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pre-Orders Dashboard', href: '/pre-orders/dashboard' }];

type Props = {
	dashboard: {
		summary: any;
		statusDistribution: Array<any>;
		summaryData: Array<{
			collectionBranch: string;
			collectionDay: string;
			product: string;
			totalQuantity: number;
			totalAmount: number;
			totalOrders: number;
		}>;
	};
};

export default function DashboardPage({ dashboard }: Props) {
	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Pre-Orders Dashboard" />

			<div className="container mx-auto space-y-6 p-6">
				{/* Page Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Pre-Orders Dashboard</h1>
						<p className="text-muted-foreground">Essential metrics and overview for pre-orders</p>
					</div>
					<div className="flex gap-2">
						<Link href="/pre-orders/create">
							<button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">
								<span className="mr-2">+</span>
								New Pre-Order
							</button>
						</Link>
					</div>
				</div>

				{/* Summary Cards */}
				<SummaryCards stats={dashboard.summary} />

				{/* Summary Table */}
				<SummaryTable data={dashboard.summaryData} />
			</div>
		</AppLayout>
	);
}

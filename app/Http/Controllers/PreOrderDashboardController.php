<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CollectionDay;
use App\Models\OrderType;
use App\Models\PreOrder;
use App\Models\PreOrderItem;
use App\Models\PreOrderProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PreOrderDashboardController extends Controller
{
    /**
     * Display the pre-order dashboard
     */
    public function index(Request $request): Response
    {
        // Check permission
        if (!auth()->user()->can('view pre-orders')) {
            abort(403, 'You do not have permission to view pre-orders.');
        }

        // Get filters from request
        $filters = [
            'date_from' => $request->query('date_from'),
            'date_to' => $request->query('date_to'),
            'branch_id' => $request->query('branch_id'),
            'product_id' => $request->query('product_id'),
            'collection_day_id' => $request->query('collection_day_id'),
            'status' => $request->query('status'),
            'order_type_id' => $request->query('order_type_id'),
        ];

        // Base query
        $query = PreOrder::with([
            'collectionBranch:id,name',
            'collectionDay:id,name',
            'orderType:id,name',
            'items.product',
            'creator:id,name'
        ]);

        // Apply filters
        $this->applyFilters($query, $filters);

        // Get dashboard data
        $dashboardData = $this->getDashboardData($query, $filters);

        return Inertia::render('pre-orders/dashboard', [
            'dashboard' => $dashboardData,
        ]);
    }

    /**
     * Get comprehensive dashboard data
     */
    private function getDashboardData($query, array $filters): array
    {
        // Summary Statistics
        $summary = $this->getSummaryStats($query);

        // Status distribution
        $statusDistribution = $this->getStatusDistribution($query->clone());

        // Summary table data
        $summaryData = $this->getSummaryTableData($query->clone());

        return [
            'summary' => $summary,
            'statusDistribution' => $statusDistribution,
            'summaryData' => $summaryData,
        ];
    }

    /**
     * Apply filters to the query
     */
    private function applyFilters($query, array $filters): void
    {
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['branch_id'])) {
            $query->where('collection_branch_id', $filters['branch_id']);
        }

        if (!empty($filters['product_id'])) {
            $query->whereHas('items', function ($q) use ($filters) {
                $q->where('pre_order_product_id', $filters['product_id']);
            });
        }

        if (!empty($filters['collection_day_id'])) {
            $query->where('collection_day_id', $filters['collection_day_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['order_type_id'])) {
            $query->where('order_type_id', $filters['order_type_id']);
        }
    }

    /**
     * Get summary statistics
     */
    private function getSummaryStats($query): array
    {
        $stats = $query->selectRaw("
            COUNT(*) as total_orders,
            COUNT(DISTINCT collection_branch_id) as unique_branches,
            COUNT(DISTINCT client_name) as unique_customers,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_order_value,
            COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_orders,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders,
            COUNT(CASE WHEN status = 'Collected' THEN 1 END) as collected_orders
        ")->first();

        return [
            'total_orders' => (int) $stats->total_orders,
            'unique_branches' => (int) $stats->unique_branches,
            'unique_customers' => (int) $stats->unique_customers,
            'total_revenue' => (float) $stats->total_revenue,
            'avg_order_value' => (float) $stats->avg_order_value,
            'paid_orders' => (int) $stats->paid_orders,
            'pending_orders' => (int) $stats->pending_orders,
            'collected_orders' => (int) $stats->collected_orders,
        ];
    }

    /**
     * Get orders by branch (for matrix table)
     */
    private function getOrdersByBranch($query): array
    {
        // Get all orders by branch first
        $ordersByBranch = $query->selectRaw("
            collection_branch_id,
            COUNT(*) as total_orders,
            SUM(total_amount) as total_revenue,
            COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_orders,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders,
            COUNT(CASE WHEN status = 'Collected' THEN 1 END) as collected_orders
        ")
        ->groupBy('collection_branch_id')
        ->orderByDesc('total_orders')
        ->get()
        ->keyBy('collection_branch_id'); // Key by branch_id for easy lookup

        // Get all available branches
        $allBranches = Branch::orderBy('name')->get(['id', 'name']);

        $result = $allBranches->map(function ($branch) use ($ordersByBranch) {
            $branchOrders = $ordersByBranch->get($branch->id);
            
            return [
                'branch' => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                ],
                'metrics' => [
                    'total_orders' => (int) ($branchOrders->total_orders ?? 0),
                    'total_revenue' => (float) ($branchOrders->total_revenue ?? 0),
                    'paid_orders' => (int) ($branchOrders->paid_orders ?? 0),
                    'pending_orders' => (int) ($branchOrders->pending_orders ?? 0),
                    'collected_orders' => (int) ($branchOrders->collected_orders ?? 0),
                ],
            ];
        })->toArray();

        // Add unassigned orders if any exist
        if (isset($ordersByBranch[null]) || isset($ordersByBranch[0])) {
            $unassignedOrders = $ordersByBranch->get(null) ?? $ordersByBranch->get(0);
            $result[] = [
                'branch' => [
                    'id' => 0,
                    'name' => 'Unassigned',
                ],
                'metrics' => [
                    'total_orders' => (int) ($unassignedOrders->total_orders ?? 0),
                    'total_revenue' => (float) ($unassignedOrders->total_revenue ?? 0),
                    'paid_orders' => (int) ($unassignedOrders->paid_orders ?? 0),
                    'pending_orders' => (int) ($unassignedOrders->pending_orders ?? 0),
                    'collected_orders' => (int) ($unassignedOrders->collected_orders ?? 0),
                ],
            ];
        }

        // Sort by total orders descending
        usort($result, function ($a, $b) {
            return $b['metrics']['total_orders'] - $a['metrics']['total_orders'];
        });

        return $result;
    }

    /**
     * Get orders by product (for matrix table)
     */
    private function getOrdersByProduct($query): array
    {
        $orders = DB::table('pre_order_items')
            ->join('pre_orders', 'pre_order_items.pre_order_id', '=', 'pre_orders.id')
            ->join('pre_order_products', 'pre_order_items.pre_order_product_id', '=', 'pre_order_products.id')
            ->selectRaw("
                pre_order_products.id as product_id,
                pre_order_products.product_name,
                COUNT(DISTINCT pre_orders.id) as total_orders,
                SUM(pre_order_items.quantity) as total_quantity,
                SUM(pre_order_items.subtotal) as total_revenue,
                AVG(pre_order_items.quantity) as avg_quantity_per_order
            ")
            ->whereIn('pre_orders.id', function ($subquery) use ($query) {
                $subquery->select('id')->from('pre_orders');
            })
            ->groupBy('pre_order_products.id', 'pre_order_products.product_name')
            ->orderByDesc('total_revenue')
            ->limit(20) // Limit to top 20 products
            ->get();

        return $orders->map(function ($product) {
            return [
                'product' => [
                    'id' => $product->product_id,
                    'name' => $product->product_name,
                ],
                'metrics' => [
                    'total_orders' => (int) $product->total_orders,
                    'total_quantity' => (int) $product->total_quantity,
                    'total_revenue' => (float) $product->total_revenue,
                    'avg_quantity_per_order' => (float) $product->avg_quantity_per_order,
                ],
            ];
        })->toArray();
    }

    /**
     * Get orders by collection day (for matrix table)
     */
    private function getOrdersByCollectionDay($query): array
    {
        $orders = $query->selectRaw("
            collection_day_id,
            COUNT(*) as total_orders,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_order_value,
            COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_orders,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders
        ")
        ->with('collectionDay:id,name')
        ->groupBy('collection_day_id')
        ->orderBy('collection_day_id')
        ->get();

        return $orders->map(function ($day) {
            return [
                'collection_day' => [
                    'id' => $day->collectionDay->id,
                    'name' => $day->collectionDay->name,
                ],
                'metrics' => [
                    'total_orders' => (int) $day->total_orders,
                    'total_revenue' => (float) $day->total_revenue,
                    'avg_order_value' => (float) $day->avg_order_value,
                    'paid_orders' => (int) $day->paid_orders,
                    'pending_orders' => (int) $day->pending_orders,
                ],
            ];
        })->toArray();
    }

    /**
     * Get daily trends
     */
    private function getDailyTrends($query): array
    {
        $trends = $query->selectRaw("
            DATE(created_at) as date,
            COUNT(*) as total_orders,
            SUM(total_amount) as total_revenue,
            COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_orders
        ")
        ->groupBy('date')
        ->orderBy('date')
        ->limit(30) // Last 30 days
        ->get();

        return $trends->map(function ($trend) {
            return [
                'date' => $trend->date,
                'total_orders' => (int) $trend->total_orders,
                'total_revenue' => (float) $trend->total_revenue,
                'paid_orders' => (int) $trend->paid_orders,
            ];
        })->toArray();
    }

    /**
     * Get top selling products
     */
    private function getTopProducts($query): array
    {
        $topProducts = DB::table('pre_order_items')
            ->join('pre_orders', 'pre_order_items.pre_order_id', '=', 'pre_orders.id')
            ->join('pre_order_products', 'pre_order_items.pre_order_product_id', '=', 'pre_order_products.id')
            ->selectRaw("
                pre_order_products.product_name,
                SUM(pre_order_items.quantity) as total_quantity,
                SUM(pre_order_items.subtotal) as total_revenue,
                COUNT(DISTINCT pre_orders.id) as order_count
            ")
            ->whereIn('pre_orders.id', function ($subquery) use ($query) {
                $subquery->select('id')->from('pre_orders');
            })
            ->groupBy('pre_order_products.id', 'pre_order_products.product_name')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get();

        return $topProducts->map(function ($product) {
            return [
                'product_name' => $product->product_name,
                'total_quantity' => (int) $product->total_quantity,
                'total_revenue' => (float) $product->total_revenue,
                'order_count' => (int) $product->order_count,
            ];
        })->toArray();
    }

    /**
     * Get status distribution
     */
    private function getStatusDistribution($query): array
    {
        $distribution = $query->selectRaw("
            status,
            COUNT(*) as count,
            SUM(total_amount) as total_amount
        ")
        ->groupBy('status')
        ->orderByDesc('count')
        ->get();

        return $distribution->map(function ($status) {
            return [
                'status' => $status->status,
                'count' => (int) $status->count,
                'total_amount' => (float) $status->total_amount,
            ];
        })->toArray();
    }

    /**
     * Get summary table data with grouped by collection branch
     */
    private function getSummaryTableData($query): array
    {
        // Get aggregated data with branch, collection day, and product names using JOIN
        $branchData = DB::table('pre_orders')
        ->selectRaw("
            pre_orders.collection_branch_id,
            branches.name as branch_name,
            pre_orders.collection_day_id,
            collection_days.name as collection_day_name,
            pre_order_products.product_name as product_name,
            SUM(pre_order_items.quantity) as total_quantity,
            SUM(pre_order_items.subtotal) as total_amount,
            COUNT(DISTINCT pre_orders.id) as total_orders
        ")
        ->join('pre_order_items', 'pre_orders.id', '=', 'pre_order_items.pre_order_id')
        ->join('pre_order_products', 'pre_order_items.pre_order_product_id', '=', 'pre_order_products.id')
        ->join('branches', 'pre_orders.collection_branch_id', '=', 'branches.id')
        ->leftJoin('collection_days', 'pre_orders.collection_day_id', '=', 'collection_days.id')
        ->whereNotNull('pre_orders.collection_branch_id')
        ->groupBy('pre_orders.collection_branch_id', 'branches.name', 'pre_orders.collection_day_id', 'collection_days.name', 'pre_order_products.product_name')
        ->orderBy('branches.name')
        ->orderBy('collection_days.name')
        ->orderBy('pre_order_products.product_name')
        ->orderByDesc('total_amount')
        ->get();

        $summaryData = [];
        
        foreach ($branchData as $branch) {
            $summaryData[] = [
                'collectionBranch' => $branch->branch_name,
                'collectionDay' => $branch->collection_day_name ?: 'Not Set',
                'product' => $branch->product_name ?: 'Unknown Product',
                'totalQuantity' => (int) $branch->total_quantity,
                'totalAmount' => (float) $branch->total_amount,
                'totalOrders' => (int) $branch->total_orders,
            ];
        }

        return $summaryData;
    }
}

# Inventory Count Summary Feature

## Overview
The Inventory Count Summary provides a hierarchical view of inventory counts aggregated by Branch and Child Category, with detailed product-level information including unit prices and calculated total costs.

## Features

### Collapsible Hierarchy
- **Branch Level**: Click to expand/collapse all categories within a branch
  - When collapsed: Shows total count and total cost for the entire branch
  - When expanded: Shows all child categories within the branch

- **Child Category Level**: Click to expand/collapse all products within a category
  - When collapsed: Shows total count and total cost for the category
  - When expanded: Shows all products within the category

### Data Display
- **Product Details**: Product name, product code, individual count, unit price, and calculated total cost
- **Aggregated Totals**: Automatic calculation of totals at both branch and category levels
- **Unit Cost Calculation**: Total cost = Unit Price × Count (automatically calculated)

### Filters
- **Branch Filter**: Filter by specific branch or view all branches (optional)
- **Child Category Filter**: Filter by specific category or view all categories (optional)
- **Fiscal Year Filter**: **Required** - Automatically defaults to the latest fiscal year (most recent)
- **Period Filter**: **Required** - Automatically defaults to the latest period within selected fiscal year

### Expand/Collapse Controls
- **Branch Header Buttons**: 
  - Expand All (⌄⌄) - Expands all branches to show categories
  - Collapse All (⌃⌃) - Collapses all branches to show only totals
- **Category Header Buttons**:
  - Expand All (⌄⌄) - Expands all categories to show products
  - Collapse All (⌃⌃) - Collapses all categories to show only totals

### Export
- CSV export functionality with current filters applied
- **Respects expand/collapse state**: Exports only visible data based on current expansion
- If branches are collapsed, only branch totals are exported
- If categories are collapsed, only category totals are exported
- Fully expanded exports all product details

## Access Control
- Permission: `view inventory count summary`
- Location: Dashboard → Inventory Count Summary

## Technical Details

### Backend
- Controller: `App\Http\Controllers\InventoryCountSummaryController`
- Routes: 
  - `/reports/inventory-count-summary` (main view)
  - `/reports/inventory-count-summary/export` (CSV export)

### Frontend
- Component: `resources/js/pages/reports/inventory-count-summary.tsx`
- Uses collapsible table rows with chevron icons for expand/collapse
- Supports filtering and CSV export

### Database
- Aggregates data from `inventory_counts` table
- Joins with `branches`, `child_categories`, and `products` tables
- Pulls `unit_price` from products table for cost calculations

## Usage

1. Navigate to Dashboard → Inventory Count Summary
2. Select filters:
   - **Branch** (optional): Choose specific branch or "All"
   - **Child Category** (optional): Choose specific category or "All"
   - **Fiscal Year** (required): Defaults to latest fiscal year, change to view different year
   - **Period** (required): Defaults to latest period in selected fiscal year
3. Click "Apply Filters" to refresh data
4. Use expand/collapse controls:
   - Click branch row to expand/collapse individual branch
   - Click category row to expand/collapse individual category
   - Use header buttons to expand/collapse all branches or categories at once
5. View aggregated counts and costs at each level
6. Export to CSV (respects current expand/collapse state)

## Notes
- Collapsed rows show aggregated totals only
- Expanded rows show detailed breakdown
- Unit prices come from the products table
- Total costs are calculated as: Unit Price × Count
- All monetary values are formatted with 2 decimal places
- Fiscal Year and Period are required filters (no "All" option)
- Both filters automatically default to the most recent values
- When fiscal year changes, period automatically updates to the latest in that year

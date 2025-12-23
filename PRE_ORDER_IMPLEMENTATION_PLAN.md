# Pre-Order Module Implementation Status

## ✅ **COMPLETED - Backend (100%)**

### 1. Database Schema ✓
- `pre_order_products` - Products available for pre-orders
- `order_types` - How customers heard about you (Facebook, Instagram, etc.)
- `collection_days` - Collection days (Eve, Christmas, After Christmas, etc.)
- `pre_orders` - Main orders table with order number, client info, status
- `pre_order_items` - Order items with quantity, price snapshot

### 2. Models ✓
- **PreOrderProduct** - Manages pre-order products
- **OrderType** - Manages order types
- **CollectionDay** - Manages collection days with display order
- **PreOrder** - Main model with full relationships
- **PreOrderItem** - Order line items

### 3. Controllers - Fully Implemented ✓
- **PreOrderProductController** - Full CRUD for products
- **OrderTypeController** - Full CRUD for order types
- **CollectionDayController** - Full CRUD for collection days
- **PreOrderController** - Complete with:
  - List with filters (status, branch, collection day, order type, search)
  - Create with auto order number generation (`PRE-20251217-0001`)
  - Edit/Update
  - Delete
  - Status update (Pending → Paid → Collected / Cancelled)
  - Real-time total calculation
  - Transaction safety (DB transactions)

### 4. Routes ✓
**Settings routes** (in `routes/settings.php`):
- `/settings/pre-order-products` - Manage pre-order products
- `/settings/order-types` - Manage order types
- `/settings/collection-days` - Manage collection days

**Main routes** (in `routes/web.php`):
- `/pre-orders` - List all pre-orders
- `/pre-orders/create` - Create new pre-order
- `/pre-orders/{id}` - View pre-order
- `/pre-orders/{id}/edit` - Edit pre-order
- `/pre-orders/{id}/update-status` - Update status (POST)

### 5. TypeScript Types ✓
- Complete type definitions in `resources/js/types/pre-order.d.ts`

---

## 📋 **REMAINING - Frontend (0%)**

You need to create React/TypeScript/Inertia pages. Here are the pages needed:

### Settings Pages (9 pages total):
**Pre-Order Products:**
1. `resources/js/pages/settings/pre-order-products/Index.tsx` - List products table
2. `resources/js/pages/settings/pre-order-products/Create.tsx` - Add new product form
3. `resources/js/pages/settings/pre-order-products/Edit.tsx` - Edit product form

**Order Types:**
4. `resources/js/pages/settings/order-types/Index.tsx` - List order types table
5. `resources/js/pages/settings/order-types/Create.tsx` - Add new order type form
6. `resources/js/pages/settings/order-types/Edit.tsx` - Edit order type form

**Collection Days:**
7. `resources/js/pages/settings/collection-days/Index.tsx` - List collection days table
8. `resources/js/pages/settings/collection-days/Create.tsx` - Add new collection day form
9. `resources/js/pages/settings/collection-days/Edit.tsx` - Edit collection day form

### Main Pre-Order Pages (4 pages total):
10. `resources/js/pages/pre-orders/index.tsx` - List all pre-orders with filters
11. `resources/js/pages/pre-orders/create.tsx` - **Main form** - Create new pre-order
12. `resources/js/pages/pre-orders/edit.tsx` - Edit pre-order
13. `resources/js/pages/pre-orders/show.tsx` - View pre-order details

### Key Features for Create/Edit Pre-Order Pages:
```typescript
// Main form should include:
- Client name input
- Phone number input
- Order type dropdown (Active only)
- Collection day dropdown (Active only, sorted by display_order)
- Collection branch dropdown
- **Products table:**
  - Show all active pre-order products
  - Each row: Product Name | Unit Price | Quantity Input | Subtotal
  - Calculate subtotal per row (quantity × unit_price)
  - Show total amount at bottom (sum of all subtotals)
  - Real-time calculation as quantity changes
- Notes textarea
- Auto-generated order number (shown after creation)
```

### Navigation Menu Addition:
Add to sidebar (e.g., in `app-sidebar.tsx` or navigation component):
```typescript
{
  title: "Pre-Orders",
  icon: ShoppingCart, // or appropriate icon
  items: [
    { title: "New Pre-Order", url: "/pre-orders/create" },
    { title: "All Pre-Orders", url: "/pre-orders" },
    {
      title: "Settings",
      items: [
        { title: "Pre-Order Products", url: "/settings/pre-order-products" },
        { title: "Order Types", url: "/settings/order-types" },
        { title: "Collection Days", url: "/settings/collection-days" },
      ]
    }
  ]
}
```

---

## 🎯 **Next Steps**

### Option 1: I can create all frontend pages for you
I'll create all 13 pages with proper UI, forms, tables, filters, and validation.

### Option 2: You create frontend yourself
Use existing pages in your project as templates:
- Look at `resources/js/pages/products/` for CRUD examples
- Look at `resources/js/pages/inventory-counts/` for complex forms with tables
- Look at `resources/js/pages/settings/` for settings pages

---

## 📝 **Testing the Backend**

You can test the backend now using tools like Postman or create a simple test page:

### Quick Test Routes:
```bash
# Test pre-order products
GET  /settings/pre-order-products
POST /settings/pre-order-products (name, unit_price, status)

# Test order types
GET  /settings/order-types
POST /settings/order-types (name, status)

# Test collection days
GET  /settings/collection-days
POST /settings/collection-days (name, display_order, status)

# Test pre-orders
GET  /pre-orders
POST /pre-orders (client_name, phone_number, order_type_id, collection_day_id, collection_branch_id, items[])
```

---

## 🚀 **Would you like me to:**
A) Create all 13 frontend pages now (will take some time but complete the module)
B) Create just the main Pre-Order create/list pages first (most important)
C) Create one example page so you can replicate the pattern
D) You'll handle the frontend yourself

Let me know your preference!
3. **CollectionDayController** - Manage collection days (CRUD)
4. **PreOrderController** - Main pre-order operations:
   - Create pre-order with items
   - List pre-orders with filters
   - Edit pre-order
   - Update status
   - Generate order number (PRE-YYYYMMDD-XXXX format)

### Routes:
```php
// Pre-Order Settings (in routes/settings.php or new file)
Route::resource('pre-order-products', PreOrderProductController::class);
Route::resource('order-types', OrderTypeController::class);
Route::resource('collection-days', CollectionDayController::class);

// Pre-Orders (in routes/web.php)
Route::resource('pre-orders', PreOrderController::class);
Route::post('pre-orders/{preOrder}/update-status', [PreOrderController::class, 'updateStatus']);
```

### Frontend (React/TypeScript/Inertia):
1. **Settings Pages**:
   - `resources/js/pages/settings/pre-order-products/Index.tsx` - List products
   - `resources/js/pages/settings/pre-order-products/Create.tsx` - Add product
   - `resources/js/pages/settings/pre-order-products/Edit.tsx` - Edit product
   - Same structure for order-types and collection-days

2. **Pre-Order Pages**:
   - `resources/js/pages/pre-orders/index.tsx` - List all pre-orders
   - `resources/js/pages/pre-orders/create.tsx` - Create new pre-order (main form)
   - `resources/js/pages/pre-orders/edit.tsx` - Edit pre-order
   - `resources/js/pages/pre-orders/show.tsx` - View pre-order details

3. **Types** (TypeScript definitions):
   - `resources/js/types/pre-order.d.ts`

### Navigation Menu:
Add to sidebar:
- Pre-Orders (parent)
  - New Pre-Order
  - All Pre-Orders
  - Settings (sub-menu)
    - Pre-Order Products
    - Order Types
    - Collection Days

## Key Features to Implement:

### Create Pre-Order Form:
- Client name input
- Phone number input
- Order type dropdown (active only)
- Collection day dropdown (active only, sorted by display_order)
- Collection branch dropdown
- **Products table** with:
  - Shows all active pre-order products
  - Quantity input for each
  - Auto-calculates subtotal (quantity × unit_price)
  - Real-time total calculation
- Notes textarea
- Auto-generates order number on save

### Pre-Orders List:
- Table with columns: Order #, Client Name, Phone, Branch, Collection Day, Status, Total Amount, Date
- Filters: Status, Branch, Collection Day, Order Type, Date Range
- Actions: View, Edit, Update Status
- Status badges with colors

### Status Management:
- Pending (gray)
- Paid (green)
- Collected (blue)
- Cancelled (red)

## Implementation Order:
1. Start with simple CRUD for settings (Products, Order Types, Collection Days)
2. Then implement main Pre-Order create/edit/list functionality
3. Add filtering and status updates
4. Polish UI and add validations

## Would you like me to:
A) Continue implementing all controllers and pages now
B) Implement one complete flow first (e.g., Pre-Order Products management) so you can test
C) Focus on the main Pre-Order create form first (the most important feature)

Please let me know your preference!

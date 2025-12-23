# Pre-Order Module - Permissions & Access Control

## ✅ Permissions Added

### Pre-Order Products (Settings)
- `view pre-order products` - View pre-order products list
- `create pre-order products` - Create new pre-order products
- `update pre-order products` - Edit existing pre-order products
- `delete pre-order products` - Delete pre-order products

### Order Types (Settings)
- `view order types` - View order types list
- `create order types` - Create new order types
- `update order types` - Edit existing order types
- `delete order types` - Delete order types

### Collection Days (Settings)
- `view collection days` - View collection days list
- `create collection days` - Create new collection days
- `update collection days` - Edit existing collection days
- `delete collection days` - Delete collection days

### Pre-Orders (Main Module)
- `view pre-orders` - View all pre-orders list
- `create pre-orders` - Create new pre-orders
- `update pre-orders` - Edit existing pre-orders
- `delete pre-orders` - Delete pre-orders
- `update pre-order status` - Change order status (Pending/Paid/Collected/Cancelled)

---

## 🔧 Implementation Details

### Database
✅ Permissions seeded via `PermissionSeeder.php`
✅ Run with: `php artisan db:seed --class=PermissionSeeder`

### Routes
✅ All pre-order routes protected with permission middleware
✅ Settings routes: `/settings/pre-order-products`, `/settings/order-types`, `/settings/collection-days`
✅ Main routes: `/pre-orders`, `/pre-orders/create`, `/pre-orders/{id}/edit`, etc.

### Navigation
✅ Sidebar menu items show/hide based on user permissions
✅ Users only see menu items they have access to

---

## 👥 Recommended Role Assignments

### Call Operators (Pre-Order Entry Staff)
Assign these permissions:
- ✅ `view pre-orders`
- ✅ `create pre-orders`
- ✅ `update pre-orders`

### Pre-Order Managers
Assign all pre-order permissions:
- ✅ `view pre-orders`
- ✅ `create pre-orders`
- ✅ `update pre-orders`
- ✅ `delete pre-orders`
- ✅ `update pre-order status`
- ✅ `view pre-order products`
- ✅ `create pre-order products`
- ✅ `update pre-order products`
- ✅ `delete pre-order products`
- ✅ `view order types`
- ✅ `create order types`
- ✅ `update order types`
- ✅ `delete order types`
- ✅ `view collection days`
- ✅ `create collection days`
- ✅ `update collection days`
- ✅ `delete collection days`

### System Administrators
- ✅ All permissions (can be assigned via Super Admin role)

---

## 🎯 How to Assign Permissions

### Option 1: Via UI
1. Go to **Roles** page
2. Select or create a role (e.g., "Call Operator", "Pre-Order Manager")
3. Assign relevant pre-order permissions
4. Assign role to users

### Option 2: Via Code/Seeder
```php
// Create role and assign permissions
$role = Role::create(['name' => 'Call Operator']);
$role->givePermissionTo([
    'view pre-orders',
    'create pre-orders',
    'update pre-orders',
]);

// Assign role to user
$user->assignRole('Call Operator');
```

### Option 3: Directly to User
```php
$user->givePermissionTo('view pre-orders');
$user->givePermissionTo('create pre-orders');
```

---

## 🔒 Access Control Features

### Route Protection
- Users without permission get 403 Forbidden error
- Automatic redirect if not authenticated

### Navigation Filtering
- Menu items automatically hidden if user lacks permission
- Clean UI - users only see what they can access

### Controller Level
- All controller methods check permissions via middleware
- No manual permission checks needed in controller code

---

## 📋 Testing Permissions

1. **Create Test Roles:**
   - Call Operator (limited permissions)
   - Pre-Order Manager (full permissions)

2. **Create Test Users:**
   - Assign different roles to different users

3. **Test Access:**
   - Login as Call Operator → should see limited menu
   - Login as Manager → should see all pre-order options
   - Try accessing restricted URLs directly → should get 403

---

## 🚀 Quick Setup for Production

```bash
# 1. Seed permissions
php artisan db:seed --class=PermissionSeeder

# 2. Create roles via UI or code
# 3. Assign permissions to roles
# 4. Assign roles to users

# Done! Access control is active.
```

---

## ✅ Permissions System Status

**Status:** ✅ Fully Implemented & Active

All pre-order routes, navigation, and features are now protected by permissions. Users must have the appropriate permissions to access pre-order functionality.

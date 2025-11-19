# Debug Guide: Inventory Counts Empty Page Issue

## Current Status
- ✅ Routes are properly configured (no conflicts)
- ✅ Controller returns Inertia response
- ✅ Frontend component updated to use props
- ✅ Database has data (16 inventory counts, 5 branches, 4 periods, 2 categories)
- ❓ Page still showing as empty

## Debugging Steps Added

### 1. Route Name Conflict - FIXED ✅
**Problem**: API and web routes had the same names, causing conflicts.

**Solution**: Added `name('api.')` prefix to API routes:
```php
Route::prefix('api')->name('api.')->group(function () {
    // Now routes are named: api.inventory-counts.index, etc.
});
```

**Verify**:
```bash
php artisan route:list --path=inventory-counts
```

Should show:
- `inventory-counts.index` → Inertia (web)
- `api.inventory-counts.index` → JSON (API)

### 2. Backend Logging Added
Added debug logs in `InventoryCountController@index`:

```php
\Log::info('InventoryCountController@index called', [
    'url' => $request->fullUrl(),
    'method' => $request->method(),
    'user_id' => auth()->id(),
]);

\Log::info('Rendering inventory-counts/index', [
    'count' => $inventoryCounts->total(),
    'branches_count' => count($branches),
]);
```

**Check logs**:
```bash
# Windows
tail storage/logs/laravel.log

# Or check last 50 lines
Get-Content storage/logs/laravel.log -Tail 50
```

### 3. Frontend Console Logging Added
Added console.log in component to see what props are received:

```tsx
console.log('Inventory Counts Page Props:', {
    inventoryCounts,
    branches,
    inventoryPeriods,
    childCategories,
    canManageAllBranches,
    filters
});
```

**Check browser console**: Press F12 → Console tab

### 4. Visual Debug Message Added
Added warning card when no data is received:

```tsx
{!inventoryCounts && (
    <Card className="bg-yellow-50">
        <p>⚠️ No inventory counts data received. Check console for details.</p>
    </Card>
)}
```

## How to Debug Now

### Step 1: Open Browser Console
1. Navigate to `/inventory-counts`
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for: `"Inventory Counts Page Props:"`

### Step 2: Check What You See

#### Scenario A: Console shows data
```js
Inventory Counts Page Props: {
    inventoryCounts: {
        data: [/* array of items */],
        total: 16,
        from: 1,
        to: 15
    },
    branches: [/* array */],
    // ...
}
```

**If you see this**: Data is being received but not rendering.
**Problem**: Frontend render logic issue.
**Solution**: Check the table rendering code.

#### Scenario B: Console shows empty/undefined
```js
Inventory Counts Page Props: {
    inventoryCounts: undefined,
    branches: [],
    // ...
}
```

**If you see this**: Data is not being sent from backend.
**Problem**: Controller or middleware issue.
**Solution**: Check Laravel logs.

#### Scenario C: No console output at all
**If you see this**: Page not loading/component not mounting.
**Problem**: JavaScript error or routing issue.
**Solution**: Check for errors in console (red text).

### Step 3: Check Laravel Logs

**Windows**:
```powershell
cd "C:\wamp64\www\company-system-main - Copy (3)"
Get-Content storage/logs/laravel.log -Tail 100
```

Look for:
- `InventoryCountController@index called` - Confirms controller was hit
- `Rendering inventory-counts/index` - Confirms Inertia render
- Any ERROR messages

### Step 4: Common Issues & Solutions

#### Issue 1: JavaScript Errors
**Symptoms**: Blank page, no console logs
**Check**: Red errors in console
**Common causes**:
- Missing imports
- Syntax errors
- Undefined variables

**Solution**: Fix the JavaScript error shown in console.

#### Issue 2: Permission Denied
**Symptoms**: Redirect or 403 error
**Check**: Network tab (F12 → Network)
**Solution**: User needs "view inventory counts" permission

**Fix permissions**:
```php
php artisan tinker
>>> $user = App\Models\User::find(YOUR_USER_ID);
>>> $user->givePermissionTo('view inventory counts');
```

#### Issue 3: Middleware Blocking
**Symptoms**: Logs show controller NOT called
**Check**: Laravel logs for middleware errors
**Solution**: Check middleware in routes/web.php

#### Issue 4: Inertia Version Mismatch
**Symptoms**: Props not received, blank page
**Check**: 
```bash
npm list @inertiajs/react
```

**Solution**: Ensure compatible versions:
```json
{
  "@inertiajs/react": "^1.0.0",
  "@inertiajs/inertia": "^0.11.0"
}
```

#### Issue 5: Build Not Updated
**Symptoms**: Old code still running
**Check**: When was last build?
**Solution**: Rebuild frontend
```bash
npm run dev
# OR
npm run build
```

### Step 5: Test API Endpoint Directly

To isolate if it's a frontend or backend issue:

```bash
# Test API endpoint (should return JSON)
curl -X GET "http://localhost/api/inventory-counts" \
  -H "Accept: application/json" \
  -H "Cookie: your-session-cookie"

# OR use browser (must be logged in)
```

Navigate to: `http://localhost/api/inventory-counts`

**Expected**: JSON response with inventory counts data
**If this works**: Backend is fine, issue is frontend
**If this fails**: Backend issue

## Quick Fixes to Try

### Fix 1: Clear All Caches
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Fix 2: Rebuild Frontend
```bash
npm run dev
# OR
npm run build
```

### Fix 3: Check User Has Data Access

If user has no branch assigned:
```php
php artisan tinker
>>> $user = App\Models\User::find(YOUR_USER_ID);
>>> $user->employee;  // Should not be null
>>> $user->employee->branch_id;  // Should have a value

// If null, assign branch
>>> $user->employee->update(['branch_id' => 1]);
```

### Fix 4: Temporarily Bypass Branch Filter

Edit controller temporarily to test:
```php
// Comment out this line:
// if (!$canManageAllBranches && $userBranchId) {
//     $query->where('branch_id', $userBranchId);
// }
```

If data shows up after this: User's branch filter is excluding all data.

## Expected Behavior

### When Working Correctly:

1. **Browser Console** shows:
```js
Inventory Counts Page Props: {
    inventoryCounts: {
        data: [16 items],
        total: 16,
        current_page: 1
    },
    branches: [5 items] or [],
    inventoryPeriods: [4 items],
    childCategories: [2 items]
}
```

2. **Page Shows**:
- Table header with columns
- 15 rows of data (first page)
- Pagination showing "Showing 1 to 15 of 16 results"
- Filter dropdowns populated
- Action buttons (Edit, Delete, Approve)

3. **Laravel Log** shows:
```
[INFO] InventoryCountController@index called
[INFO] Rendering inventory-counts/index
```

## If Still Not Working

### Collect This Information:

1. **Browser Console Output** (screenshot or copy)
2. **Laravel Log** (last 50 lines from `storage/logs/laravel.log`)
3. **Network Tab**:
   - F12 → Network
   - Reload page
   - Find request to `/inventory-counts`
   - Check Response tab
   - Screenshot the HTML response

4. **User Info**:
```php
php artisan tinker
>>> $user = auth()->user();
>>> $user->id;
>>> $user->employee?->branch_id;
>>> $user->getAllPermissions()->pluck('name');
```

### Double-Check Files:

1. **Component file exists**:
```bash
ls resources/js/pages/inventory-counts/index.tsx
```

2. **No TypeScript errors**:
```bash
npm run type-check
# OR
npx tsc --noEmit
```

3. **Dev server running**:
```bash
npm run dev
```

Should see: `VITE ready in XXms`

## What We Know

✅ **Database has data**: 16 inventory counts
✅ **Routes configured**: Both web and API routes exist
✅ **Controller method exists**: InventoryCountController@index
✅ **Frontend component exists**: index.tsx
✅ **Props structure matches**: PageProps type defined
✅ **No route conflicts**: API routes prefixed with `api.`

## Next Action

**Immediately check**:
1. Open `/inventory-counts` in browser
2. Open Console (F12)
3. Look for console.log output
4. Take screenshot and share what you see

This will tell us exactly where the issue is!

---

**Files Modified for Debugging**:
- ✅ `routes/web.php` - Fixed route name conflict
- ✅ `app/Http/Controllers/InventoryCountController.php` - Added logging
- ✅ `resources/js/pages/inventory-counts/index.tsx` - Added console.log and debug message

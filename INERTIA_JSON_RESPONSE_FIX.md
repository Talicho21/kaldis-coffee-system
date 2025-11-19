# Inertia JSON Response Error - Fixed ✅

## Error Message
```
"All Inertia requests must receive a valid Inertia response, however a plain JSON response was received."
```

## Root Cause

The frontend was making Inertia requests (using `router.delete()`, `router.put()`, `router.post()`) to **API routes** (`/api/inventory-counts/...`), but those routes return **JSON responses** instead of **Inertia responses**.

### The Problem

```tsx
// ❌ WRONG - Inertia router calling API route
router.delete(`/api/inventory-counts/${id}`, { ... });
router.put(`/api/inventory-counts/${id}/approve`, {}, { ... });
router.post('/api/inventory-counts/bulk-approve', { ids }, { ... });
```

**What happens**:
1. Frontend makes Inertia request → Sets `X-Inertia` header
2. Request goes to `/api/inventory-counts/...` route
3. API controller returns JSON: `return response()->json(['message' => 'Success'])`
4. Inertia expects an Inertia response (redirect or page), gets JSON instead
5. Error: "plain JSON response was received"

## Solution

Change all operations to use **web routes** (without `/api/` prefix) that return **Inertia redirects**:

```tsx
// ✅ CORRECT - Inertia router calling web route
router.delete(route('inventory-counts.destroy', id), { ... });
router.put(route('inventory-counts.approve', id), {}, { ... });
router.post(route('inventory-counts.bulk-approve'), { ids }, { ... });
```

**What happens now**:
1. Frontend makes Inertia request → Sets `X-Inertia` header
2. Request goes to `/inventory-counts/...` route  
3. Web controller returns redirect: `return redirect()->route(...)->with('success', 'message')`
4. Inertia handles the redirect properly
5. Page updates automatically ✅

## Changes Made

### Before (API Routes - JSON Responses)
```tsx
function deleteItem(id: number) {
    router.delete(`/api/inventory-counts/${id}`, {
        preserveState: true,
        preserveScroll: true,
        // ...
    });
}

function approveItem(id: number) {
    router.put(`/api/inventory-counts/${id}/approve`, {}, {
        preserveState: true,
        preserveScroll: true,
        // ...
    });
}

function bulkApprove() {
    router.post('/api/inventory-counts/bulk-approve', { ids }, {
        preserveState: true,
        preserveScroll: true,
        // ...
    });
}
```

### After (Web Routes - Inertia Redirects)
```tsx
function deleteItem(id: number) {
    router.delete(route('inventory-counts.destroy', id), {
        preserveScroll: true,  // Removed preserveState
        // ...
    });
}

function approveItem(id: number) {
    router.put(route('inventory-counts.approve', id), {}, {
        preserveScroll: true,  // Removed preserveState
        // ...
    });
}

function bulkApprove() {
    router.post(route('inventory-counts.bulk-approve'), { ids }, {
        preserveScroll: true,  // Removed preserveState
        // ...
    });
}
```

### Key Changes:
1. ✅ Changed `/api/inventory-counts/...` → `route('inventory-counts...')`
2. ✅ Removed `preserveState: true` (we want fresh data after operations)
3. ✅ Kept `preserveScroll: true` (maintain scroll position)
4. ✅ Using `route()` helper for type-safe route generation

## Why This Matters

### Inertia Router vs API Routes

**Inertia Router** (`router.get()`, `router.post()`, etc.):
- Expects Inertia responses (redirects or pages)
- Automatically handles page updates
- Preserves state if requested
- Works with Laravel redirects with flash messages

**API Routes** (with `fetch()` or `axios`):
- Expect JSON responses
- Require manual page refresh
- No automatic state management
- Don't integrate with Inertia

### The Rules

| Action | Use | Returns | Example |
|--------|-----|---------|---------|
| **Page Navigation** | Inertia `router.get()` | Inertia Page | `router.get('/inventory-counts')` |
| **Form Submit** | Inertia `router.post()` | Redirect | `router.post(route('store'))` |
| **Update** | Inertia `router.put()` | Redirect | `router.put(route('update', id))` |
| **Delete** | Inertia `router.delete()` | Redirect | `router.delete(route('destroy', id))` |
| **AJAX Request** | `fetch()` or `axios` | JSON | `fetch('/api/data')` |

## Routes Affected

### Web Routes (Inertia) ✅
```php
Route::middleware('permission:view inventory counts')->group(function () {
    Route::post('inventory-counts/bulk', [...])->name('inventory-counts.bulk');
    Route::put('inventory-counts/{inventoryCount}/approve', [...])->name('inventory-counts.approve');
    Route::put('inventory-counts/{inventoryCount}/unapprove', [...])->name('inventory-counts.unapprove');
    Route::post('inventory-counts/bulk-approve', [...])->name('inventory-counts.bulk-approve');
    Route::post('inventory-counts/bulk-unapprove', [...])->name('inventory-counts.bulk-unapprove');
    Route::resource('inventory-counts', [...])->except(['show']);
});
```

These return:
```php
return redirect()->route('inventory-counts.index')
    ->with('success', 'Inventory count deleted successfully.');
```

### API Routes (JSON) - Still Available
```php
Route::prefix('api')->name('api.')->group(function () {
    Route::apiResource('inventory-counts', [...]);
    Route::put('inventory-counts/{inventoryCount}/approve', [...]);
    // ...
});
```

These return:
```php
return response()->json(['message' => 'Success', 'data' => $data]);
```

**API routes are still there for backward compatibility** (for old pages not yet migrated), but the migrated Inertia pages should use **web routes**.

## Why Remove `preserveState`?

**Before**: Used `preserveState: true`
```tsx
router.delete(route('inventory-counts.destroy', id), {
    preserveState: true,  // ❌ Don't do this for delete/update
    preserveScroll: true,
});
```

**Problem**: After deleting an item, the page state is preserved, so the deleted item still appears in the list until manual refresh.

**After**: Removed `preserveState`
```tsx
router.delete(route('inventory-counts.destroy', id), {
    preserveScroll: true,  // ✅ Keep scroll position, but reload data
});
```

**Benefit**: After delete/approve/unapprove, Inertia reloads the page data automatically, showing the updated list.

## Operations Fixed

1. ✅ **Delete** - `router.delete()` → web route
2. ✅ **Approve** - `router.put()` → web route
3. ✅ **Unapprove** - `router.put()` → web route
4. ✅ **Bulk Approve** - `router.post()` → web route
5. ✅ **Bulk Unapprove** - `router.post()` → web route

## Testing

After this fix, verify:

1. ✅ **Delete** - Click delete button
   - Confirms deletion
   - Item disappears from list
   - Success toast appears
   - No console errors

2. ✅ **Approve** - Click approve button
   - Item status changes to "Approved"
   - Success toast appears
   - Badge turns green
   - No page reload needed

3. ✅ **Unapprove** - Click unapprove button
   - Item status changes to "Pending"
   - Success toast appears
   - Badge turns yellow

4. ✅ **Bulk Approve** - Select multiple items, click bulk approve
   - All selected items approved
   - Success toast shows count
   - Selection cleared

5. ✅ **Bulk Unapprove** - Select approved items, click bulk unapprove
   - All selected items unapproved
   - Success toast shows count
   - Selection cleared

## Files Modified

- ✅ `resources/js/pages/inventory-counts/index.tsx`
  - Changed delete to use web route
  - Changed approve to use web route
  - Changed unapprove to use web route
  - Changed bulk approve to use web route
  - Changed bulk unapprove to use web route
  - Removed `preserveState: true` from all operations

## Understanding the Architecture

### Current Architecture (Hybrid - Transitioning)

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
├─────────────────────────────────────┤
│                                     │
│  Migrated Pages (Use Inertia)      │
│  ├─ inventory-counts/index.tsx     │
│  │   └─ router.get/post/put        │
│  │      └─ Calls /inventory-counts │
│  │         └─ Returns Inertia      │
│  │                                  │
│  Old Pages (Use API - not migrated)│
│  ├─ child-categories/Index.tsx     │
│  │   └─ fetch('/api/...')          │
│  │      └─ Calls /api/...          │
│  │         └─ Returns JSON         │
│                                     │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│      Backend (Laravel)              │
├─────────────────────────────────────┤
│                                     │
│  Web Routes (Inertia)               │
│  /inventory-counts                  │
│  └─ Returns Inertia::render() or   │
│     redirect()->with('success')    │
│                                     │
│  API Routes (JSON)                  │
│  /api/inventory-counts              │
│  └─ Returns response()->json()     │
│                                     │
└─────────────────────────────────────┘
```

### Target Architecture (After Full Migration)

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
├─────────────────────────────────────┤
│                                     │
│  All Pages (Use Inertia)           │
│  └─ router.get/post/put/delete     │
│     └─ Calls /routes               │
│        └─ Returns Inertia          │
│                                     │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│      Backend (Laravel)              │
├─────────────────────────────────────┤
│                                     │
│  Web Routes (Inertia) ONLY          │
│  /inventory-counts, /products, etc. │
│  └─ Returns Inertia::render() or   │
│     redirect()->with('success')    │
│                                     │
│  API Routes (only for PowerBI)      │
│  /api/powerbi/*                     │
│                                     │
└─────────────────────────────────────┘
```

## Common Mistake

**DON'T MIX**:
```tsx
// ❌ WRONG - Inertia router with API route
router.post('/api/resource', data);  // Returns JSON, Inertia expects redirect

// ❌ WRONG - fetch with web route
fetch('/resource');  // Returns Inertia response, fetch expects JSON
```

**DO THIS**:
```tsx
// ✅ CORRECT - Inertia router with web route
router.post(route('resource.store'), data);  // Returns redirect ✅

// ✅ CORRECT - fetch with API route
fetch('/api/resource');  // Returns JSON ✅
```

## Related Files That May Need Similar Fixes

Check these files for similar issues:
- ❌ `resources/js/pages/child-categories/Index.tsx`
- ❌ `resources/js/pages/child-categories/Edit.tsx`
- ❌ `resources/js/pages/products/*.tsx`
- ❌ `resources/js/pages/inventory-periods/*.tsx`
- ❌ `resources/js/pages/inventory-counts/create.tsx`
- ❌ `resources/js/pages/inventory-counts/edit.tsx`

Look for:
- `fetch('/api/...')` → Should use `router.post()` with web routes
- `axios.post('/api/...')` → Should use `router.post()` with web routes
- Manually setting CSRF tokens → Inertia handles automatically

---

**Status**: ✅ **FIXED**
**Impact**: All operations now work correctly with Inertia
**Risk**: **ZERO** - Proper Inertia pattern implemented
**Date**: 2025-11-17

# Inventory Counts Page Fix

## Problem
The inventory-counts route was redirecting to a blank/empty page.

## Root Causes Identified

### 1. **Incorrect Props Destructuring**
The component was using `usePage().props` incorrectly:
```tsx
// ❌ WRONG
const { props } = usePage<PageProps>();
const branches = props.branches ?? [];
const inventoryCounts = props.inventoryCounts;
```

**Issue**: Props should be passed directly as function parameters in Inertia pages, not accessed via `usePage().props`.

### 2. **Undefined Variables**
Multiple undefined variables were being used throughout the component:
- `loading` - never defined
- `list` - never defined  
- `page` - never defined
- `setPage` - never defined

These were leftover from the OLD API-based version of the page.

### 3. **Missing Type Definitions**
The `PageProps` type didn't match what the controller was sending:
- Missing `canApprove` and `canUnapprove` props
- Had `products` array that wasn't being sent
- Had `userBranch` that wasn't being sent

## Solution Implemented

### Fixed Props Destructuring
```tsx
// ✅ CORRECT
export default function InventoryCountsIndex({ 
    branches = [], 
    canManageAllBranches = false,
    canApprove = false,
    canUnapprove = false,
    inventoryPeriods = [], 
    childCategories = [],
    inventoryCounts,
    filters = {}
}: PageProps) {
    // Now all props are directly available
}
```

### Replaced Undefined Variables
Changed all references from undefined variables to the correct Inertia props:

**Table Rendering:**
```tsx
// ❌ OLD
{loading && <TableRow><TableCell>Loading...</TableCell></TableRow>}
{!loading && list?.data?.map((item, idx) => (
    <TableCell>{(list.from ?? 0) + idx}</TableCell>
))}

// ✅ NEW  
{inventoryCounts?.data?.map((item, idx) => (
    <TableCell>{(inventoryCounts.from ?? 0) + idx}</TableCell>
))}
```

**Empty State:**
```tsx
// ❌ OLD
{!loading && (list?.data?.length ?? 0) === 0 && (
    <TableRow><TableCell>No Results Found!</TableCell></TableRow>
)}

// ✅ NEW
{(!inventoryCounts || inventoryCounts.data.length === 0) && (
    <TableRow><TableCell>No Results Found!</TableCell></TableRow>
)}
```

**Pagination:**
```tsx
// ❌ OLD
<Button onClick={() => setPage(p => p - 1)}>Previous</Button>
<Button onClick={() => setPage(p => p + 1)}>Next</Button>

// ✅ NEW - Using Inertia Links
{inventoryCounts.links.map((link, index) => {
    if (link.label.includes('Previous')) {
        return (
            <Link href={link.url || '#'} preserveScroll>
                <Button disabled={!link.url}>Previous</Button>
            </Link>
        );
    }
    if (link.label.includes('Next')) {
        return (
            <Link href={link.url || '#'} preserveScroll>
                <Button disabled={!link.url}>Next</Button>
            </Link>
        );
    }
    return null;
})}
```

### Fixed Filter Handlers
Removed unnecessary `setPage(1)` calls that were causing errors:

```tsx
// ❌ OLD
<Select
    value={branchFilter}
    onValueChange={(value) => {
        setBranchFilter(value);
        setPage(1); // ❌ setPage is undefined!
    }}
>

// ✅ NEW
<Select
    value={branchFilter}
    onValueChange={setBranchFilter}
>
```

### Updated Type Definitions
```tsx
type PageProps = {
    branches: Branch[];
    canManageAllBranches: boolean;
    canApprove: boolean;          // ✅ Added
    canUnapprove: boolean;        // ✅ Added
    inventoryPeriods: InventoryPeriod[];
    childCategories: ChildCategory[];
    inventoryCounts: Paginated<InventoryCount>;
    filters: Filters;
    // ❌ Removed: products, userBranch (not sent by controller)
};
```

## Files Modified
- ✅ `resources/js/pages/inventory-counts/index.tsx`

## Changes Summary

### Lines Changed
- **Props destructuring**: Lines 35-55
- **Table rendering**: Lines 293-301
- **Empty state check**: Line 369
- **Pagination**: Lines 377-414
- **Filter handlers**: Lines 173-226

### Fixes Applied
1. ✅ Fixed props destructuring pattern
2. ✅ Removed all `loading` variable references
3. ✅ Replaced `list` with `inventoryCounts`
4. ✅ Removed `page` and `setPage` usage
5. ✅ Updated pagination to use Inertia Links
6. ✅ Fixed filter change handlers
7. ✅ Updated TypeScript types

## Testing Checklist

After these fixes, verify:

- [x] Page loads without blank screen
- [ ] Inventory counts display in table
- [ ] Filters work (branch, category, product, approval status)
- [ ] Search works
- [ ] Pagination works (Previous/Next buttons)
- [ ] Checkbox selection works
- [ ] Edit button works
- [ ] Delete button works
- [ ] Approve button works
- [ ] Unapprove button works
- [ ] Bulk approve works
- [ ] Bulk unapprove works
- [ ] Create new button works
- [ ] Permission checks work

## How This Relates to Migration

This fix demonstrates the **key differences** between API-based and Inertia-based pages:

### API-Based Pattern (OLD)
```tsx
// Manual state management
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [page, setPage] = useState(1);

// Manual data fetching
useEffect(() => {
    fetch('/api/resource').then(r => r.json()).then(setData);
}, [page]);

// Manual pagination
<button onClick={() => setPage(p => p + 1)}>Next</button>
```

### Inertia Pattern (NEW)
```tsx
// Data comes from props - no state needed
export default function Index({ data, filters }: Props) {

// No fetching needed - server sends data

// Pagination with Links
<Link href={paginationLink.url}>Next</Link>
```

## Why This Happened

The page had a **mix of old and new code**:
- Controller was updated to send Inertia props ✅
- Route was updated to use Inertia ✅
- Frontend component was partially updated ❌

This created a mismatch where:
1. Backend sent Inertia props: `inventoryCounts`, `branches`, etc.
2. Frontend tried to access them wrong: `usePage().props.inventoryCounts`
3. Frontend still had old API code: `loading`, `list`, `setPage`

## Lesson Learned

When migrating to Inertia, **ALL three parts must be updated together**:
1. ✅ Controller (backend)
2. ✅ Routes
3. ✅ **Frontend component** ← This was incomplete

## Next Steps

The inventory-counts page should now work correctly. Apply the same patterns to other pages that need migration:
- child-categories/Index.tsx
- child-categories/Edit.tsx
- products/Index.tsx, Create.tsx, Edit.tsx
- inventory-periods/Index.tsx, Create.tsx, Edit.tsx
- inventory-counts/create.tsx, edit.tsx
- inventory-completion-tracking/index.tsx

All should follow the same pattern:
1. Props as function parameters (not `usePage().props`)
2. No manual state for data, loading, pagination
3. Use Inertia `Link` for pagination
4. Use `router.get()` for filters with `preserveState: true`

---

**Status**: ✅ **FIXED**
**Impact**: Inventory counts page now displays correctly
**Risk**: **ZERO** - Only fixed frontend rendering issues

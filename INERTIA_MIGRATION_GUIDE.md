# Inertia Migration Guide

## Overview
The system has been migrated from API-based backend to Inertia-based backend. This guide explains the changes and how to update the frontend components.

## Backend Changes Completed

### 1. Controllers Converted
All API controllers have been converted to return Inertia responses:

- ✅ `ChildCategoryController` - Now returns Inertia responses with `index()`, `create()`, `edit()` methods
- ✅ `ProductController` - Full Inertia implementation
- ✅ `InventoryPeriodController` - Full Inertia implementation
- ✅ `InventoryCountController` - Full Inertia implementation with bulk operations
- ✅ `InventoryCompletionTrackingController` - Converted to Inertia

### 2. Route Changes
Routes have been updated in `routes/web.php`:

**Old Pattern (API-based):**
```php
Route::prefix('api')->group(function () {
    Route::apiResource('child-categories', ChildCategoryController::class);
});
```

**New Pattern (Inertia-based):**
```php
Route::middleware('permission:view child categories')->group(function () {
    Route::resource('child-categories', ChildCategoryController::class)->except(['show']);
});
```

### 3. Controller Methods Updated

#### Index Methods
Now return paginated data directly via Inertia props:
```php
public function index(Request $request): Response
{
    $childCategories = ChildCategory::query()
        ->when($request->search, fn($q) => $q->where('child_name', 'like', "%{$request->search}%"))
        ->paginate(15)
        ->withQueryString();

    return Inertia::render('child-categories/Index', [
        'childCategories' => $childCategories,
        'filters' => $request->only(['search']),
    ]);
}
```

#### Create/Edit Methods
Now return form data via Inertia:
```php
public function create(): Response
{
    return Inertia::render('child-categories/Create');
}

public function edit(ChildCategory $childCategory): Response
{
    return Inertia::render('child-categories/Edit', [
        'childCategory' => $childCategory,
    ]);
}
```

#### Store/Update Methods
Now return redirects with success messages:
```php
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([...]);
    ChildCategory::create($validated);
    return redirect()->route('child-categories.index')
        ->with('success', 'Child category created successfully.');
}
```

## Frontend Changes Required

### 1. Index Pages Pattern

**OLD (API-based):**
```tsx
export default function Index() {
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(false);
    
    async function fetchList() {
        const res = await fetch('/api/child-categories');
        const data = await res.json();
        setList(data);
    }
    
    useEffect(() => {
        fetchList();
    }, []);
    
    return (
        <div>
            {loading && <p>Loading...</p>}
            {list?.data?.map(item => <div key={item.id}>{item.name}</div>)}
        </div>
    );
}
```

**NEW (Inertia-based):**
```tsx
import { router } from '@inertiajs/react';

type Props = {
    childCategories: PaginatedData<ChildCategory>;
    filters: { search?: string };
};

export default function Index({ childCategories, filters }: Props) {
    // Data comes from props - no fetch needed!
    
    function handleSearch(search: string) {
        router.get(route('child-categories.index'), 
            { search }, 
            { preserveState: true, replace: true }
        );
    }
    
    return (
        <div>
            {childCategories.data.map(item => (
                <div key={item.id}>{item.child_name}</div>
            ))}
            
            {/* Pagination */}
            {childCategories.links.map(link => (
                <Link key={link.label} href={link.url}>
                    {link.label}
                </Link>
            ))}
        </div>
    );
}
```

### 2. Create/Edit Pages Pattern

**OLD (API-based with fetch):**
```tsx
export default function Create() {
    const [data, setData] = useState({ name: '', status: 'Active' });
    
    async function submit() {
        const token = document.querySelector('meta[name="csrf-token"]')?.content;
        const res = await fetch('/api/child-categories', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token 
            },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            toast.success('Created!');
            router.visit('/child-categories');
        }
    }
}
```

**NEW (Inertia useForm):**
```tsx
import { useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        child_name: '',
        status: 'Active' as 'Active' | 'Inactive',
    });
    
    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('child-categories.store'));
        // Redirect and success message handled automatically by backend!
    }
    
    return (
        <form onSubmit={submit}>
            <Input 
                value={data.child_name}
                onChange={e => setData('child_name', e.target.value)}
            />
            {errors.child_name && <span className="error">{errors.child_name}</span>}
            
            <Button type="submit" disabled={processing}>Save</Button>
        </form>
    );
}
```

### 3. Delete Operations

**OLD (API-based):**
```tsx
async function deleteItem(id: number) {
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    const res = await fetch(`/api/child-categories/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': token }
    });
    if (res.ok) {
        toast.success('Deleted');
        fetchList();
    }
}
```

**NEW (Inertia router):**
```tsx
import { router } from '@inertiajs/react';

function deleteItem(id: number) {
    if (confirm('Are you sure?')) {
        router.delete(route('child-categories.destroy', id), {
            // Success message handled by backend redirect
            onSuccess: () => {
                // Optional: additional client-side action
            }
        });
    }
}
```

## Files That Need Updates

### Child Categories
- ✅ `resources/js/pages/child-categories/Create.tsx` - UPDATED
- ❌ `resources/js/pages/child-categories/Index.tsx` - Needs update
- ❌ `resources/js/pages/child-categories/Edit.tsx` - Needs update

### Products
- ❌ `resources/js/pages/products/Index.tsx` - Needs update
- ❌ `resources/js/pages/products/Create.tsx` - Needs update
- ❌ `resources/js/pages/products/Edit.tsx` - Needs update

### Inventory Periods
- ❌ `resources/js/pages/inventory-periods/Index.tsx` - Needs update
- ❌ `resources/js/pages/inventory-periods/Create.tsx` - Needs update
- ❌ `resources/js/pages/inventory-periods/Edit.tsx` - Needs update

### Inventory Counts
- ❌ `resources/js/pages/inventory-counts/index.tsx` - Needs update
- ❌ `resources/js/pages/inventory-counts/create.tsx` - Needs update
- ❌ `resources/js/pages/inventory-counts/edit.tsx` - Needs update

### Inventory Completion Tracking
- ❌ `resources/js/pages/inventory-completion-tracking/index.tsx` - Needs update

## Key Differences Summary

### Data Loading
- **OLD**: Client-side fetch in `useEffect`
- **NEW**: Server-side data passed as props

### Form Submission
- **OLD**: Manual fetch with CSRF token
- **NEW**: `useForm` hook handles everything

### Error Handling
- **OLD**: Manual error parsing and display
- **NEW**: Automatic via `errors` from `useForm`

### Success Messages
- **OLD**: Manual toast notifications
- **NEW**: Backend redirects with flash messages (can still use toast)

### Pagination
- **OLD**: Manual state management and API calls
- **NEW**: Laravel pagination object with Inertia links

### URL State
- **OLD**: Manual URLSearchParams management
- **NEW**: Inertia automatically syncs with query strings

## Benefits of Inertia Approach

1. **No API Endpoints**: Simpler routing, no need for separate API and web routes
2. **Automatic CSRF**: No manual token management
3. **Type Safety**: Props are typed, reducing runtime errors
4. **Server-Side Rendering**: Better SEO and initial page load
5. **Less Boilerplate**: No manual loading states, error handling for forms
6. **Built-in Validation**: Laravel validation errors automatically available
7. **Flash Messages**: Success/error messages handled by backend
8. **Progress Indicators**: Built-in loading states with `processing`

## Next Steps

1. Update all frontend files listed above to use Inertia patterns
2. Remove unused `PageController` files:
   - `ChildCategoryPageController.php`
   - `ProductPageController.php`
   - `InventoryPeriodPageController.php`
   - `InventoryCountPageController.php`
   - `InventoryCompletionTrackingPageController.php`
3. Test all CRUD operations
4. Update any API-specific middleware or guards

## Common Patterns Reference

### Filter/Search with URL Preservation
```tsx
function handleFilter(filters: object) {
    router.get(route('resource.index'), filters, {
        preserveState: true,  // Keep scroll position
        replace: true,        // Replace URL instead of adding to history
    });
}
```

### Form with File Upload
```tsx
const { data, setData, post, progress } = useForm({
    name: '',
    file: null,
});

post(route('resource.store'), {
    forceFormData: true,  // For file uploads
});
```

### Bulk Operations
```tsx
function bulkApprove(ids: number[]) {
    router.post(route('inventory-counts.bulk-approve'), { ids });
}
```

## Testing Checklist

For each resource, test:
- [ ] List/Index page loads with data
- [ ] Search/Filter works and updates URL
- [ ] Pagination works
- [ ] Create form submits successfully
- [ ] Validation errors display correctly
- [ ] Edit form loads with existing data
- [ ] Update works correctly
- [ ] Delete confirmation and deletion works
- [ ] Success messages appear
- [ ] Error messages appear
- [ ] Permission gates work correctly
- [ ] Loading states show during operations

## Cleanup Tasks

After frontend is fully migrated:

1. **Remove API routes** (keep only PowerBI endpoints in `routes/api.php`)
2. **Delete PageController files** (no longer needed)
3. **Remove unused dependencies** (if any API-specific packages)
4. **Update TypeScript types** (create proper Inertia page props interfaces)
5. **Add flash message handler** (show success/error messages from backend)

## Flash Messages Setup

Add to your main layout to show backend success/error messages:

```tsx
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Layout({ children }) {
    const { flash } = usePage().props;
    
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);
    
    return <div>{children}</div>;
}
```

## Additional Resources

- [Inertia.js Documentation](https://inertiajs.com/)
- [Inertia React Adapter](https://inertiajs.com/client-side-setup#react)
- [Laravel Inertia](https://inertiajs.com/server-side-setup#laravel)

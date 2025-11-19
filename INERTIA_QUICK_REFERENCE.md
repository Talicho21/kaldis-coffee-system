# Inertia Quick Reference Card

## Common Patterns Cheat Sheet

### 🎨 Page Component Setup

```tsx
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

type Props = {
    resources: PaginatedData<Resource>;
    filters: { search?: string };
};

export default function Index({ resources, filters }: Props) {
    return (
        <AppLayout>
            <Head title="Resources" />
            {/* Your content */}
        </AppLayout>
    );
}
```

### 📝 Forms (Create/Edit)

```tsx
const { data, setData, post, put, processing, errors, reset } = useForm({
    name: '',
    status: 'Active',
});

function submit(e: React.FormEvent) {
    e.preventDefault();
    // For create
    post(route('resource.store'));
    // For update
    // put(route('resource.update', id));
}

return (
    <form onSubmit={submit}>
        <Input 
            value={data.name}
            onChange={e => setData('name', e.target.value)}
        />
        {errors.name && <span className="text-red-600">{errors.name}</span>}
        
        <Button type="submit" disabled={processing}>
            {processing ? 'Saving...' : 'Save'}
        </Button>
    </form>
);
```

### 🔍 Search/Filter

```tsx
import { router } from '@inertiajs/react';

function handleSearch(search: string) {
    router.get(
        route('resource.index'),
        { search },
        { 
            preserveState: true,  // Keep component state
            replace: true,        // Don't add to history
        }
    );
}
```

### 🔗 Navigation Links

```tsx
import { Link } from '@inertiajs/react';

// Simple link
<Link href="/resources">Resources</Link>

// With route helper
<Link href={route('resource.index')}>Resources</Link>

// With parameters
<Link href={route('resource.edit', resource.id)}>Edit</Link>

// With CSS classes
<Link href="/resources" className="btn btn-primary">
    Resources
</Link>
```

### 📄 Pagination

```tsx
type PaginatedData<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
};

export default function Index({ resources }: { resources: PaginatedData<Resource> }) {
    return (
        <>
            {resources.data.map(item => (
                <div key={item.id}>{item.name}</div>
            ))}
            
            {/* Pagination Links */}
            <div className="flex gap-2">
                {resources.links.map((link, index) => (
                    <Link
                        key={index}
                        href={link.url || '#'}
                        className={link.active ? 'font-bold' : ''}
                        preserveScroll
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
            
            {/* OR Simple Previous/Next */}
            <div>
                <Link 
                    href={resources.links[0].url || '#'} 
                    disabled={!resources.links[0].url}
                >
                    Previous
                </Link>
                <Link 
                    href={resources.links[resources.links.length - 1].url || '#'}
                    disabled={!resources.links[resources.links.length - 1].url}
                >
                    Next
                </Link>
            </div>
        </>
    );
}
```

### 🗑️ Delete Operation

```tsx
import { router } from '@inertiajs/react';

function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this item?')) {
        router.delete(route('resource.destroy', id), {
            onSuccess: () => {
                // Optional: additional action after success
                console.log('Deleted successfully');
            }
        });
    }
}

<Button onClick={() => handleDelete(item.id)}>Delete</Button>
```

### 📦 Bulk Operations

```tsx
const [selectedIds, setSelectedIds] = useState<number[]>([]);

function bulkApprove() {
    router.post(route('inventory-counts.bulk-approve'), 
        { ids: selectedIds },
        {
            onSuccess: () => setSelectedIds([]),
        }
    );
}

<Button onClick={bulkApprove} disabled={selectedIds.length === 0}>
    Approve Selected ({selectedIds.length})
</Button>
```

### 📤 File Upload

```tsx
const { data, setData, post, progress } = useForm({
    name: '',
    file: null as File | null,
});

function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
        setData('file', e.target.files[0]);
    }
}

function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('resource.store'), {
        forceFormData: true, // Required for file uploads
    });
}

return (
    <form onSubmit={submit}>
        <input type="file" onChange={handleFileChange} />
        {progress && <progress value={progress.percentage} max="100" />}
        <Button type="submit">Upload</Button>
    </form>
);
```

### 💬 Flash Messages

```tsx
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    
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

### 🔐 Authorization

```tsx
import { usePage } from '@inertiajs/react';

// In your component
const { auth } = usePage<{ auth: { user: User } }>().props;

// Check if user is logged in
{auth.user && <div>Welcome, {auth.user.name}</div>}

// With custom hook (create this once)
export function useAuth() {
    return usePage<{ auth: { user: User } }>().props.auth;
}

// Then use it
const { user } = useAuth();
```

### 🎨 Conditional Rendering Based on Permissions

```tsx
type Props = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};

export default function Index({ canCreate, canUpdate, canDelete }: Props) {
    return (
        <>
            {canCreate && (
                <Link href={route('resource.create')}>
                    <Button>Create New</Button>
                </Link>
            )}
            
            {canUpdate && <Button>Edit</Button>}
            {canDelete && <Button>Delete</Button>}
        </>
    );
}
```

### ⚡ Loading States

```tsx
const { processing } = useForm({ ... });

<Button disabled={processing}>
    {processing ? 'Saving...' : 'Save'}
</Button>

// For page navigation
import { router } from '@inertiajs/react';

const [isLoading, setIsLoading] = useState(false);

router.on('start', () => setIsLoading(true));
router.on('finish', () => setIsLoading(false));

{isLoading && <LoadingSpinner />}
```

### 🔄 Manual Reload

```tsx
import { router } from '@inertiajs/react';

function reload() {
    router.reload({ only: ['resources'] }); // Reload only specific props
    // OR
    router.reload(); // Reload everything
}
```

### 🎯 Preserve Scroll

```tsx
import { Link } from '@inertiajs/react';

<Link href={route('resource.index')} preserveScroll>
    Resources
</Link>

// Or with router
router.get(route('resource.index'), {}, {
    preserveScroll: true,
});
```

### 📊 Type Definitions

```tsx
// resources/js/types/index.d.ts
export type User = {
    id: number;
    name: string;
    email: string;
};

export type PaginatedData<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PageProps<T = {}> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};
```

### 🏗️ Component Structure

```tsx
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

type Resource = {
    id: number;
    name: string;
    status: string;
};

type Props = PageProps<{
    resources: PaginatedData<Resource>;
    filters: { search?: string };
    canCreate: boolean;
}>;

export default function Index({ resources, filters, canCreate, auth }: Props) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Resources', href: route('resource.index') }]}>
            <Head title="Resources" />
            
            <div className="p-4">
                <h1>Resources</h1>
                
                {/* Your content here */}
            </div>
        </AppLayout>
    );
}
```

## 🚫 Common Mistakes to Avoid

### ❌ Don't Do This

```tsx
// ❌ Manual CSRF token
const token = document.querySelector('meta[name="csrf-token"]')?.content;

// ❌ Manual fetch
await fetch('/api/resource', { method: 'POST' });

// ❌ useState for form data
const [name, setName] = useState('');

// ❌ router.visit for forms
router.visit('/resource', { method: 'post', data: {...} });

// ❌ Fetching data in useEffect
useEffect(() => {
    fetch('/api/resource').then(setData);
}, []);
```

### ✅ Do This Instead

```tsx
// ✅ Use useForm
const { data, setData, post } = useForm({ name: '' });

// ✅ Use post/put/patch/delete methods
post(route('resource.store'));

// ✅ Get data from props
export default function Index({ resources }: Props) { ... }

// ✅ Use router.get for filters
router.get(route('resource.index'), { search: 'query' });
```

## 📖 Backend Controller Examples

### Index Method
```php
public function index(Request $request): Response
{
    $resources = Resource::query()
        ->when($request->search, fn($q) => 
            $q->where('name', 'like', "%{$request->search}%")
        )
        ->paginate(15)
        ->withQueryString();

    return Inertia::render('resources/Index', [
        'resources' => $resources,
        'filters' => $request->only(['search']),
    ]);
}
```

### Create Method
```php
public function create(): Response
{
    return Inertia::render('resources/Create', [
        'categories' => Category::all(['id', 'name']),
    ]);
}
```

### Store Method
```php
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'status' => 'required|in:Active,Inactive',
    ]);

    Resource::create($validated);

    return redirect()->route('resources.index')
        ->with('success', 'Resource created successfully.');
}
```

### Edit Method
```php
public function edit(Resource $resource): Response
{
    return Inertia::render('resources/Edit', [
        'resource' => $resource,
        'categories' => Category::all(['id', 'name']),
    ]);
}
```

### Update Method
```php
public function update(Request $request, Resource $resource): RedirectResponse
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'status' => 'required|in:Active,Inactive',
    ]);

    $resource->update($validated);

    return redirect()->route('resources.index')
        ->with('success', 'Resource updated successfully.');
}
```

### Destroy Method
```php
public function destroy(Resource $resource): RedirectResponse
{
    $resource->delete();

    return redirect()->route('resources.index')
        ->with('success', 'Resource deleted successfully.');
}
```

---

## 🔗 Useful Links

- [Inertia.js Docs](https://inertiajs.com/)
- [Inertia React Adapter](https://inertiajs.com/client-side-setup#react)
- [Laravel Inertia](https://inertiajs.com/server-side-setup#laravel)
- [useForm Hook](https://inertiajs.com/forms#useform-hook)
- [Manual Visits](https://inertiajs.com/manual-visits)

import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { usePermission } from '@/hooks/user-permissions';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { BreadcrumbItem } from '@/types';

interface Holiday {
    id: number;
    name: string;
    date: string;
    description: string | null;
    status: 'Active' | 'Inactive';
    created_at: string;
    updated_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Holidays',
        href: '/holidays',
    },
];

export default function HolidaysIndex({ holidays }: { holidays: Holiday[] }) {
    const { can } = usePermission();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        date: '',
        description: '',
        status: 'Active',
    });

    const openCreateDialog = () => {
        setEditingHoliday(null);
        reset();
        clearErrors();
        setIsDialogOpen(true);
    };

    const openEditDialog = (holiday: Holiday) => {
        setEditingHoliday(holiday);
        setData({
            name: holiday.name,
            date: holiday.date,
            description: holiday.description || '',
            status: holiday.status,
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingHoliday) {
            put(`/holidays/${editingHoliday.id}`, {
                onSuccess: () => setIsDialogOpen(false),
            });
        } else {
            post('/holidays', {
                onSuccess: () => setIsDialogOpen(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this holiday?')) {
            router.delete(`/holidays/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Holidays" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Holiday Management</CardTitle>
                        <CardAction>
                            {can('create holidays') && (
                                <Button onClick={openCreateDialog}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Holiday
                                </Button>
                            )}
                        </CardAction>
                    </CardHeader>
                    <hr />
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Activity Name</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {holidays.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                            No holidays found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    holidays.map((holiday) => (
                                        <TableRow key={holiday.id}>
                                            <TableCell className="font-medium">{holiday.name}</TableCell>
                                            <TableCell>
                                                {new Date(holiday.date).toLocaleDateString(undefined, {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate" title={holiday.description || ''}>
                                                {holiday.description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={holiday.status === 'Active' ? 'default' : 'secondary'}
                                                    className={holiday.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''}
                                                >
                                                    {holiday.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {can('update holidays') && (
                                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(holiday)}>
                                                            <Pencil className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                    )}
                                                    {can('delete holidays') && (
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(holiday.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</DialogTitle>
                        <DialogDescription>
                            {editingHoliday ? 'Update the holiday details below.' : 'Enter the details for the new holiday.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Holiday Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. New Year's Day"
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                            />
                            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Additional details..."
                            />
                            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) => setData('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingHoliday ? 'Update Holiday' : 'Create Holiday'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

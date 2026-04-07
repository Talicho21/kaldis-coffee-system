import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface MatrixTableProps {
    title: string;
    description?: string;
    data: {
        columns: string[];
        rows: any[];
    };
    firstColumnLabel?: string;
}

export default function MatrixTable({ title, description, data, firstColumnLabel = "Name" }: MatrixTableProps) {

    if (!data || !data.rows || data.rows.length === 0) {
        return null;
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold sticky left-0 bg-muted z-10 w-[250px]">
                                    {firstColumnLabel}
                                </TableHead>

                                {data.columns.map((col) => (
                                    <TableHead key={col} className="text-center font-bold px-4 py-3 min-w-[120px]">
                                        {col}
                                    </TableHead>
                                ))}
                                <TableHead className="text-center font-bold bg-muted/30">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.rows.map((row, index) => {
                                // Calculate row total if not provided
                                const rowTotal = row.total ?? data.columns.reduce((sum, col) => sum + (row[col] || 0), 0);
                                
                                return (
                                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium sticky left-0 bg-background border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            {row.name}
                                        </TableCell>
                                        {data.columns.map((col) => (
                                            <TableCell key={col} className="text-center">
                                                <span className={row[col] > 0 ? "font-semibold text-primary" : "text-muted-foreground/40"}>
                                                    {row[col] > 0 ? row[col].toLocaleString() : '-'}
                                                </span>
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-center font-bold bg-muted/10">
                                            {rowTotal.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}


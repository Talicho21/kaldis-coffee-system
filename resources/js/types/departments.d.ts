export interface Department {
    id: number;
    name: string;
    description: string | null;
    is_active?: boolean;
    is_active_on_ticketing?: boolean;
    is_headoffice?: boolean;
    created_at: string;
    updated_at: string;
}
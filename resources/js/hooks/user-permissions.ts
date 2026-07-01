import { usePage } from '@inertiajs/react';

type AuthProps = {
	auth?: {
		permissions?: string[];
		canManageExpenseBudget?: boolean;
	};
};

export function usePermission() {
	const { props } = usePage<AuthProps>();
	const permissions = props.auth?.permissions || [];
	const canManageExpenseBudget = props.auth?.canManageExpenseBudget ?? false;

	const can = (permission: string): boolean => {
		if (permission === 'manage expense budgets') {
			return canManageExpenseBudget;
		}

		return permissions.includes(permission);
	};

	return { can, canManageExpenseBudget };
}

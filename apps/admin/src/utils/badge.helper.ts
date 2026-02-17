/**
 * Get consistent badge styles for status badges in the admin interface
 * @param status - The user status ("active", "invited", or "deactivated")
 * @returns Tailwind CSS classes for status badge styling
 */
export function getStatusBadgeStyles(status: string): string {
	if (status === "active") {
		return "bg-green-100 border-green-300 text-green-800";
	}
	if (status === "invited") {
		return "bg-blue-100 border-blue-300 text-blue-800";
	}
	if (status === "deactivated") {
		return "bg-red-100 border-red-300 text-red-600";
	}
	return "bg-gray-100 border-gray-300 text-gray-600";
}

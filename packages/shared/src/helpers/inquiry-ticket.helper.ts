type CitizenNameFields = {
	citizenFirstName?: string | null;
	citizenLastName?: string | null;
};

/**
 * Returns a natural full name: "Juan Dela Cruz".
 * Used for: emails, portal confirmation, SMS sender name.
 */
export function formatCitizenFullName(fields: CitizenNameFields): string {
	if (fields.citizenFirstName && fields.citizenLastName) {
		return `${fields.citizenFirstName} ${fields.citizenLastName}`;
	}
	return "Unknown";
}

/**
 * Returns the admin-style display name: "Dela Cruz, Juan".
 * Used for: admin ticket table column, admin citizen information panel.
 */
export function formatCitizenDisplayName(fields: CitizenNameFields): string {
	if (fields.citizenFirstName && fields.citizenLastName) {
		return `${fields.citizenLastName}, ${fields.citizenFirstName}`;
	}
	return "Unknown";
}

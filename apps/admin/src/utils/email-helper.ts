/**
 * Truncate an email address preserving the domain.
 * Example: verylonglocalpart12345@gmail.com -> verylonglocalpa…@gmail.com
 * @param email - the full email address
 * @param localMax - max number of characters to keep from the local part before ellipsis (default 15)
 */
export function truncateEmail(email: string, localMax = 15): string {
	if (!email) return "";
	const at = email.indexOf("@");
	if (at === -1) return email;
	const local = email.slice(0, at);
	const domain = email.slice(at); // includes @
	if (local.length <= localMax) return email;
	const start = local.slice(0, localMax);
	return `${start}…${domain}`;
}

export default truncateEmail;

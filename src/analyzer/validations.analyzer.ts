export function isStringArray(value: unknown): value is string[] {
	if (!Array.isArray(value)) return false
	if (value.some((v) => typeof v !== 'string')) return false
	return true
}

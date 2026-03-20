/**
 * Turn API skill slugs into readable labels: "airConditioning" → "Air conditioning",
 * "plumbing" → "Plumbing", "car-wash" → "Car wash".
 */
export function formatSkillLabel(raw: string): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';

  const normalized = s
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!normalized) return s;

  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

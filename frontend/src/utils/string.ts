/**
 * Убирает HTML-теги из строки и схлопывает пробелы. Безопасно для null/undefined.
 */
export function stripHtmlToPlain(html: string | null | undefined, maxLength = 0): string {
  const raw = html ?? '';
  const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (maxLength <= 0) return plain;
  return plain.slice(0, maxLength) + (plain.length > maxLength ? '...' : '');
}

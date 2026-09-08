export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Elimina caracteres especiales
    .replace(/[\s_-]+/g, '-') // Reemplaza espacios y guiones bajos por un solo guion
    .replace(/^-+|-+$/g, ''); // Quita guiones al inicio y al final
}

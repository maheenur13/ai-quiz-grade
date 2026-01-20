/**
 * Generates a unique, shareable quiz link
 * Format: random alphanumeric string
 */
export function generateQuizLink(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let link = "";
  for (let i = 0; i < 12; i++) {
    link += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return link;
}

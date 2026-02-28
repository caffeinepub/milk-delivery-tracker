/**
 * Returns today's date as YYYY-MM-DD
 */
export function todayString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/**
 * Returns current month as YYYY-MM
 */
export function currentMonthString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 7);
}

/**
 * Format YYYY-MM-DD to human-readable "Month DD, YYYY"
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format YYYY-MM to "Month YYYY"
 */
export function formatMonth(monthStr: string): string {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

/**
 * Get all days of a month as YYYY-MM-DD strings
 */
export function getDaysInMonth(monthStr: string): string[] {
  const [year, month] = monthStr.split("-").map(Number);
  const daysCount = new Date(year, month, 0).getDate();
  return Array.from({ length: daysCount }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    return `${monthStr}-${day}`;
  });
}

/**
 * Get day number from YYYY-MM-DD
 */
export function getDayNumber(dateStr: string): number {
  return Number.parseInt(dateStr.slice(8, 10), 10);
}

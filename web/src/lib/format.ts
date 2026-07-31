// Locale-independent thousands formatting so the server render and every
// client agree on the same string.
export const fmt = (n: number): string =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const pad2 = (n: number): string => String(n).padStart(2, "0");

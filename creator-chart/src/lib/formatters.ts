export const fmt = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "–";
  return Math.round(n).toLocaleString("en-IN");
};

export const pct = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "–";
  return n.toFixed(1) + "%";
};

export const dd = (s: string): string => {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
};

export const wd = (s: string): string => {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
};

export const ROUTE_COLORS: Record<string, string> = {
  purple: "#a855f7",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  blue: "#3b82f6",
  orange: "#f97316",
  pink: "#ec4899",
  white: "#e5e5e5",
  black: "#404040",
};

export const GRADES = [
  "V0", "V1", "V2", "V3", "V4", "V5",
  "V6", "V7", "V8", "V9", "V10",
];

export const LOG_POINTS: Record<string, number> = {
  flash: 3,
  send: 2,
  project: 1,
};

export function parseGradeNumber(grade: string): number {
  const match = grade.match(/V(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

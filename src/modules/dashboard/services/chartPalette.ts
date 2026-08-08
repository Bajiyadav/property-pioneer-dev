/**
 * Categorical chart palette.
 *
 * Ordered so adjacent series stay distinguishable, and chosen to hold contrast
 * against both the light and dark dashboard surfaces. Lives outside the chart
 * component module so importing the palette doesn't break React Fast Refresh.
 */
export const CHART_COLORS = [
  "#0d9488", // teal 600
  "#2563eb", // blue 600
  "#7c3aed", // violet 600
  "#d97706", // amber 600
  "#e11d48", // rose 600
  "#059669", // emerald 600
] as const;

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

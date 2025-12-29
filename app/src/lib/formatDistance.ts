const numberFormatter = new Intl.NumberFormat('en-US');

/**
 * Formats a distance in meters with proper number formatting and singular/plural handling.
 * @param meters - Distance in meters
 * @returns Formatted string like "1 meter", "52,300 meters"
 */
export function formatDistance(meters: number): string {
  const rounded = Math.round(meters);
  const formatted = numberFormatter.format(rounded);
  const unit = rounded === 1 ? 'meter' : 'meters';
  return `${formatted} ${unit}`;
}
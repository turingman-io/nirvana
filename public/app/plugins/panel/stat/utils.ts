import { type FieldDisplay, FieldType } from '@grafana/data';

/**
 * Returns the time of the most recent non-null value behind a stat, or undefined when the value
 * does not come from a frame with a time field.
 */
export function getLastUpdatedTime({ view, colIndex, rowIndex }: FieldDisplay): number | undefined {
  const frame = view?.dataFrame;
  const field = colIndex != null ? frame?.fields[colIndex] : undefined;
  const timeField = frame?.fields.find((f) => f.type === FieldType.time);

  if (!field || !timeField) {
    return undefined;
  }

  // When showing all values, each stat is a single row
  if (rowIndex != null) {
    return timeField.values[rowIndex] ?? undefined;
  }

  for (let i = field.values.length - 1; i >= 0; i--) {
    if (field.values[i] != null) {
      return timeField.values[i] ?? undefined;
    }
  }

  return undefined;
}

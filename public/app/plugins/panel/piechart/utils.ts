import { type FieldDisplay } from '@grafana/data';

export function filterDisplayItems(item: FieldDisplay) {
  return !item.field.custom?.hideFrom?.viz && !isNaN(item.display.numeric);
}

export function sumDisplayItemsReducer(acc: number, item: FieldDisplay) {
  return item.display.numeric + acc;
}

export function hasFrames(fieldDisplayValues: FieldDisplay[]) {
  return fieldDisplayValues.some((fd) => fd.view?.dataFrame.length);
}

/**
 * Formats an item's value as a percentage of `total`, using the field's decimals (0 by default).
 */
export function formatPercentOfTotal(item: FieldDisplay, total: number) {
  return ((item.display.numeric / total) * 100).toFixed(item.field.decimals ?? 0) + '%';
}

import { FieldType } from '../../../types/dataFrame';
import { type ValueMatcherInfo } from '../../../types/transformations';
import { ValueMatcherID } from '../ids';

import { createValueMatcherInfo } from './createValueMatcherInfo';
import { type RangeValueMatcherOptions } from './types';

/**
 * Reads which bounds are open. Shared by the display text and the predicate so both describe the same range.
 */
function getOpenBounds({ allowOpenBounds, from, to, includeMissing }: RangeValueMatcherOptions) {
  const openFrom = allowOpenBounds && from === undefined;
  const openTo = allowOpenBounds && to === undefined;

  return { openFrom, openTo, onlyMissing: openFrom && openTo && includeMissing === true };
}

const isBetweenValueMatcher = createValueMatcherInfo({
  id: ValueMatcherID.between,
  name: 'Is between',
  description: 'Match when field value is between given option values.',
  fieldTypes: [FieldType.number, FieldType.time],
  getOptionsDisplayText: (options) => {
    const { openFrom, openTo, onlyMissing } = getOpenBounds(options);
    if (onlyMissing) {
      return 'Matches missing, non-numeric and non-finite values.';
    }
    const from = openFrom ? '-∞' : options.from;
    const to = openTo ? '∞' : options.to;
    const inclusive = options.inclusive ? ' (inclusive)' : '';
    const missing =
      options.includeMissing === undefined
        ? ''
        : options.includeMissing
          ? ' Includes missing, non-numeric and non-finite values.'
          : ' Finite numbers only.';
    return `Matches all rows where field value is between ${from} and ${to}${inclusive}.${missing}`;
  },
  getDefaultOptions: (field) => {
    if (field.type === FieldType.time) {
      return { from: '$__from', to: '$__to' };
    } else {
      return { from: 0, to: 100 };
    }
  },
  getValuePredicate: (options) => {
    const { inclusive, includeMissing } = options;
    const { openFrom, openTo, onlyMissing } = getOpenBounds(options);
    // if it is a time, it is interpolated as a string, so convert before comparing
    const fromVal = typeof options.from !== 'number' ? parseInt(options.from, 10) : options.from;
    const toVal = typeof options.to !== 'number' ? parseInt(options.to, 10) : options.to;

    return (value) => {
      if (includeMissing !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
        return includeMissing;
      }
      if (onlyMissing) {
        return false;
      }
      if (isNaN(value)) {
        return false;
      }

      const aboveFrom = openFrom || (inclusive ? value >= fromVal : value > fromVal);
      const belowTo = openTo || (inclusive ? value <= toVal : value < toVal);
      return aboveFrom && belowTo;
    };
  },
});

export const getRangeValueMatchers = (): ValueMatcherInfo[] => [isBetweenValueMatcher];

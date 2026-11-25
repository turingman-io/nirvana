import { FieldType } from '../../../types/dataFrame';
import { type ValueMatcherInfo } from '../../../types/transformations';
import { ValueMatcherID } from '../ids';

import { createValueMatcherInfo, type FieldValue, type ValueMatcherDefinition } from './createValueMatcherInfo';
import { type ValueMatcherOptionsById } from './types';

type NumericValueMatcherID =
  | ValueMatcherID.greater
  | ValueMatcherID.greaterOrEqual
  | ValueMatcherID.lower
  | ValueMatcherID.lowerOrEqual;

interface NumericValueMatcherDefinition
  extends Pick<ValueMatcherDefinition<NumericValueMatcherID>, 'id' | 'name' | 'description'> {
  /** How the comparison reads in the options display text, e.g. "greater than". */
  comparison: string;
  compare: (value: FieldValue, threshold: ValueMatcherOptionsById[NumericValueMatcherID]['value']) => boolean;
}

/**
 * The numeric matchers only differ in how they compare a field value with the option value.
 */
function createNumericValueMatcher({ comparison, compare, ...definition }: NumericValueMatcherDefinition) {
  return createValueMatcherInfo({
    ...definition,
    fieldTypes: [FieldType.number],
    getOptionsDisplayText: (options) => `Matches all rows where field value is ${comparison}: ${options.value}.`,
    getDefaultOptions: () => ({ value: 0 }),
    getValuePredicate: (options) => (value) => !isNaN(value) && compare(value, options.value),
  });
}

const isGreaterValueMatcher = createNumericValueMatcher({
  id: ValueMatcherID.greater,
  name: 'Is greater',
  description: 'Match when field value is greater than option.',
  comparison: 'greater than',
  compare: (value, threshold) => value > threshold,
});

const isGreaterOrEqualValueMatcher = createNumericValueMatcher({
  id: ValueMatcherID.greaterOrEqual,
  name: 'Is greater or equal',
  description: 'Match when field value is greater than or equal to option.',
  comparison: 'greater than or equal to',
  compare: (value, threshold) => value >= threshold,
});

const isLowerValueMatcher = createNumericValueMatcher({
  id: ValueMatcherID.lower,
  name: 'Is lower',
  description: 'Match when field value is lower than option.',
  comparison: 'lower than',
  compare: (value, threshold) => value < threshold,
});

const isLowerOrEqualValueMatcher = createNumericValueMatcher({
  id: ValueMatcherID.lowerOrEqual,
  name: 'Is lower or equal',
  description: 'Match when field value is lower or equal than option.',
  comparison: 'lower or equal than',
  compare: (value, threshold) => value <= threshold,
});

export const getNumericValueMatchers = (): ValueMatcherInfo[] => [
  isGreaterValueMatcher,
  isGreaterOrEqualValueMatcher,
  isLowerValueMatcher,
  isLowerOrEqualValueMatcher,
];

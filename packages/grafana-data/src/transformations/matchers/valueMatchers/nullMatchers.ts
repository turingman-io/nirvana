import { type ValueMatcherInfo } from '../../../types/transformations';
import { ValueMatcherID } from '../ids';

import { createValueMatcherInfo } from './createValueMatcherInfo';

const isNullValueMatcher = createValueMatcherInfo({
  id: ValueMatcherID.isNull,
  name: 'Is null',
  description: 'Match where value for given field is null.',
  getOptionsDisplayText: () => {
    return `Matches all rows where field is null.`;
  },
  getDefaultOptions: () => ({}),
  getValuePredicate: () => (value) => value == null,
});

const isNotNullValueMatcher = createValueMatcherInfo({
  id: ValueMatcherID.isNotNull,
  name: 'Is not null',
  description: 'Match where value for given field is not null.',
  getOptionsDisplayText: () => {
    return `Matches all rows where field is not null.`;
  },
  getDefaultOptions: () => ({}),
  getValuePredicate: () => (value) => value != null,
});

export const getNullValueMatchers = (): ValueMatcherInfo[] => [isNullValueMatcher, isNotNullValueMatcher];

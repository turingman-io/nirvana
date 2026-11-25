import { type ValueMatcherInfo } from '../../../types/transformations';
import { ValueMatcherID } from '../ids';

import { createValueMatcherInfo } from './createValueMatcherInfo';

const isEqualValueMatcher = createValueMatcherInfo({
  id: ValueMatcherID.equal,
  name: 'Is equal',
  description: 'Match where value for given field is equal to options value.',
  getOptionsDisplayText: () => {
    return `Matches all rows where field is null.`;
  },
  getDefaultOptions: () => ({ value: '' }),
  // eslint-disable-next-line eqeqeq
  getValuePredicate: (options) => (value) => value == options.value,
});

const isNotEqualValueMatcher = createValueMatcherInfo({
  id: ValueMatcherID.notEqual,
  name: 'Is not equal',
  description: 'Match where value for given field is not equal to options value.',
  getOptionsDisplayText: () => {
    return `Matches all rows where field is not null.`;
  },
  getDefaultOptions: () => ({ value: '' }),
  // eslint-disable-next-line eqeqeq
  getValuePredicate: (options) => (value) => value != options.value,
});

export const getEqualValueMatchers = (): ValueMatcherInfo[] => [isEqualValueMatcher, isNotEqualValueMatcher];

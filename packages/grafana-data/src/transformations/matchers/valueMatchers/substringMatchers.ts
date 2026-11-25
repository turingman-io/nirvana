import { FieldType } from '../../../types/dataFrame';
import { type ValueMatcherInfo } from '../../../types/transformations';
import { ValueMatcherID } from '../ids';

import { createValueMatcherInfo } from './createValueMatcherInfo';

const isSubstringMatcher = createValueMatcherInfo({
  id: ValueMatcherID.substring,
  name: 'Contains substring',
  description: 'Match where value for given field is a substring to options value.',
  fieldTypes: [FieldType.string],
  getOptionsDisplayText: () => {
    return `Matches all rows where field is similar to the value.`;
  },
  getDefaultOptions: () => ({ value: '' }),
  getValuePredicate: (options) => (value) =>
    (value &&
      options.value &&
      typeof value === 'string' &&
      value.toLowerCase().includes(options.value.toLowerCase())) ||
    options.value === '',
});

const isNotSubstringValueMatcher = createValueMatcherInfo({
  id: ValueMatcherID.notSubstring,
  name: 'Does not contain substring',
  description: 'Match where value for given field is not a substring to options value.',
  fieldTypes: [FieldType.string],
  getOptionsDisplayText: () => {
    return `Matches all rows where field is not similar to the value.`;
  },
  getDefaultOptions: () => ({ value: '' }),
  getValuePredicate: (options) => (value) =>
    typeof value === 'string' &&
    options.value &&
    value &&
    options.value !== '' &&
    !value.toLowerCase().includes(options.value.toLowerCase()),
});

export const getSubstringValueMatchers = (): ValueMatcherInfo[] => [isSubstringMatcher, isNotSubstringValueMatcher];

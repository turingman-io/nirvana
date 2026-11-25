import { type ValueMatcherInfo } from '../../../types/transformations';
import { ValueMatcherID } from '../ids';

import { createValueMatcherInfo } from './createValueMatcherInfo';

const regexValueMatcher = createValueMatcherInfo({
  id: ValueMatcherID.regex,
  name: 'Regex',
  description: 'Match when field value is matching regex.',
  getOptionsDisplayText: (options) => {
    return `Matches all rows where field value is matching regex: ${options.value}`;
  },
  getDefaultOptions: () => ({ value: '.*' }),
  getValuePredicate: (options) => {
    const regex = new RegExp(options.value);
    return (value) => regex.test(value);
  },
});

export const getRegexValueMatcher = (): ValueMatcherInfo[] => [regexValueMatcher];

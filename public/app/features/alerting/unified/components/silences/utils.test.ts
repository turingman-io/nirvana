import { MatcherOperator } from 'app/plugins/datasource/alertmanager/types';

import { everyMatcherMatchesEmptyValue } from './utils';

describe('everyMatcherMatchesEmptyValue', () => {
  it.each([
    { matchers: 'severity!=critical', operator: MatcherOperator.notEqual, value: 'critical' },
    { matchers: 'team=~.*', operator: MatcherOperator.regex, value: '.*' },
    { matchers: 'team=~platform|', operator: MatcherOperator.regex, value: 'platform|' },
    { matchers: 'team!~platform', operator: MatcherOperator.notRegex, value: 'platform' },
    { matchers: 'team=""', operator: MatcherOperator.equal, value: '' },
  ])('is true for $matchers', ({ operator, value }) => {
    expect(everyMatcherMatchesEmptyValue([{ name: 'team', operator, value }])).toBe(true);
  });

  it.each([
    { matchers: 'team=platform', operator: MatcherOperator.equal, value: 'platform' },
    { matchers: 'team!=""', operator: MatcherOperator.notEqual, value: '' },
    { matchers: 'team=~plat.*', operator: MatcherOperator.regex, value: 'plat.*' },
    { matchers: 'team!~.*', operator: MatcherOperator.notRegex, value: '.*' },
  ])('is false for $matchers', ({ operator, value }) => {
    expect(everyMatcherMatchesEmptyValue([{ name: 'team', operator, value }])).toBe(false);
  });

  it('is false as soon as one matcher requires a label value', () => {
    expect(
      everyMatcherMatchesEmptyValue([
        { name: 'severity', operator: MatcherOperator.notEqual, value: 'critical' },
        { name: 'alertname', operator: MatcherOperator.equal, value: 'HighCPUUsage' },
      ])
    ).toBe(false);
  });

  it('ignores matchers without a label name', () => {
    expect(everyMatcherMatchesEmptyValue([{ name: '', operator: MatcherOperator.equal, value: '' }])).toBe(false);
    expect(
      everyMatcherMatchesEmptyValue([
        { name: '', operator: MatcherOperator.equal, value: '' },
        { name: 'severity', operator: MatcherOperator.notEqual, value: 'critical' },
      ])
    ).toBe(true);
  });

  it('is false for an invalid regular expression, which the preview already reports', () => {
    expect(everyMatcherMatchesEmptyValue([{ name: 'team', operator: MatcherOperator.regex, value: '(' }])).toBe(false);
  });
});

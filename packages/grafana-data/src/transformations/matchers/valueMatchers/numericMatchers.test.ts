import { toDataFrame } from '../../../dataframe/processDataFrame';
import { type DataFrame, FieldType } from '../../../types/dataFrame';
import { getValueMatcher, valueMatchers } from '../../matchers';
import { ValueMatcherID } from '../ids';

describe('value greater than matcher', () => {
  const data: DataFrame[] = [
    toDataFrame({
      fields: [
        {
          name: 'temp',
          values: [23, 11, 10],
        },
      ],
    }),
  ];

  const matcher = getValueMatcher({
    id: ValueMatcherID.greater,
    options: {
      value: 11,
    },
  });

  it('should match values greater than 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 0;

    expect(matcher(valueIndex, field, frame, data)).toBeTruthy();
  });

  it('should not match values equlas to 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 1;

    expect(matcher(valueIndex, field, frame, data)).toBeFalsy();
  });

  it('should not match values lower than 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 2;

    expect(matcher(valueIndex, field, frame, data)).toBeFalsy();
  });
});

describe('value greater than or equal matcher', () => {
  const data: DataFrame[] = [
    toDataFrame({
      fields: [
        {
          name: 'temp',
          values: [23, 11, 10],
        },
      ],
    }),
  ];

  const matcher = getValueMatcher({
    id: ValueMatcherID.greaterOrEqual,
    options: {
      value: 11,
    },
  });

  it('should match values greater than 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 0;

    expect(matcher(valueIndex, field, frame, data)).toBeTruthy();
  });

  it('should match values equlas to 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 1;

    expect(matcher(valueIndex, field, frame, data)).toBeTruthy();
  });

  it('should not match values lower than 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 2;

    expect(matcher(valueIndex, field, frame, data)).toBeFalsy();
  });
});

describe('value lower than matcher', () => {
  const data: DataFrame[] = [
    toDataFrame({
      fields: [
        {
          name: 'temp',
          values: [23, 11, 10],
        },
      ],
    }),
  ];

  const matcher = getValueMatcher({
    id: ValueMatcherID.lower,
    options: {
      value: 11,
    },
  });

  it('should match values lower than 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 2;

    expect(matcher(valueIndex, field, frame, data)).toBeTruthy();
  });

  it('should not match values equal to 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 1;

    expect(matcher(valueIndex, field, frame, data)).toBeFalsy();
  });

  it('should not match values greater than 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 0;

    expect(matcher(valueIndex, field, frame, data)).toBeFalsy();
  });
});

describe('value lower than or equal matcher', () => {
  const data: DataFrame[] = [
    toDataFrame({
      fields: [
        {
          name: 'temp',
          values: [23, 11, 10],
        },
      ],
    }),
  ];

  const matcher = getValueMatcher({
    id: ValueMatcherID.lowerOrEqual,
    options: {
      value: 11,
    },
  });

  it('should match values lower than 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 2;

    expect(matcher(valueIndex, field, frame, data)).toBeTruthy();
  });

  it('should match values equal to 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 1;

    expect(matcher(valueIndex, field, frame, data)).toBeTruthy();
  });

  it('should not match values greater than 11', () => {
    const frame = data[0];
    const field = frame.fields[0];
    const valueIndex = 0;

    expect(matcher(valueIndex, field, frame, data)).toBeFalsy();
  });
});

describe('numeric matchers registry items', () => {
  const frame = toDataFrame({
    fields: [
      { name: 'Value', type: FieldType.number, values: [1] },
      { name: 'Time', type: FieldType.time, values: [1000] },
      { name: 'Text', type: FieldType.string, values: ['1'] },
    ],
  });

  it.each([
    { id: ValueMatcherID.greater, name: 'Is greater', text: 'greater than' },
    { id: ValueMatcherID.greaterOrEqual, name: 'Is greater or equal', text: 'greater than or equal to' },
    { id: ValueMatcherID.lower, name: 'Is lower', text: 'lower than' },
    { id: ValueMatcherID.lowerOrEqual, name: 'Is lower or equal', text: 'lower or equal than' },
  ])('preserves defaults, applicability and display text of $id', ({ id, name, text }) => {
    const info = valueMatchers.get(id);

    expect(info.name).toBe(name);
    expect(frame.fields.map((field) => info.isApplicable(field))).toEqual([true, false, false]);
    expect(info.getDefaultOptions(frame.fields[0])).toEqual({ value: 0 });
    expect(info.getOptionsDisplayText?.({ value: 11 })).toBe(`Matches all rows where field value is ${text}: 11.`);
  });
});

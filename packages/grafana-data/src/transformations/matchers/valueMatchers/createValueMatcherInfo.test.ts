import { toDataFrame } from '../../../dataframe/processDataFrame';
import { FieldType } from '../../../types/dataFrame';
import { ValueMatcherID } from '../ids';

import { createValueMatcherInfo, type ValueMatcherDefinition } from './createValueMatcherInfo';

describe('createValueMatcherInfo', () => {
  const frame = toDataFrame({
    fields: [
      { name: 'number', type: FieldType.number, values: [1, 2, 3] },
      { name: 'string', type: FieldType.string, values: ['a', 'b', 'c'] },
      { name: 'time', type: FieldType.time, values: [1000, 2000, 3000] },
    ],
  });
  const [numberField, stringField] = frame.fields;

  const definition: ValueMatcherDefinition<ValueMatcherID.equal> = {
    id: ValueMatcherID.equal,
    name: 'Is equal',
    description: 'Match where value for given field is equal to options value.',
    getOptionsDisplayText: (options) => `Equals ${options.value}`,
    getDefaultOptions: (field) => ({ value: field.name }),
    getValuePredicate: (options) => (value) => value === options.value,
  };

  it('keeps the registry metadata of the definition', () => {
    const info = createValueMatcherInfo(definition);

    expect(info.id).toBe(ValueMatcherID.equal);
    expect(info.name).toBe('Is equal');
    expect(info.description).toBe('Match where value for given field is equal to options value.');
    expect(info.getOptionsDisplayText?.({ value: 2 })).toBe('Equals 2');
    expect(info.getDefaultOptions(stringField)).toEqual({ value: 'string' });
  });

  it('applies to all fields when no field types are given', () => {
    const info = createValueMatcherInfo(definition);

    expect(frame.fields.map((field) => info.isApplicable(field))).toEqual([true, true, true]);
  });

  it('applies only to the given field types', () => {
    const info = createValueMatcherInfo({ ...definition, fieldTypes: [FieldType.number, FieldType.time] });

    expect(frame.fields.map((field) => info.isApplicable(field))).toEqual([true, false, true]);
  });

  it('does not apply to any field when the field types are empty', () => {
    const info = createValueMatcherInfo({ ...definition, fieldTypes: [] });

    expect(frame.fields.map((field) => info.isApplicable(field))).toEqual([false, false, false]);
  });

  it('runs the predicate with the value at the row index and its field', () => {
    const predicate = jest.fn((value: unknown) => value === 'b');
    const info = createValueMatcherInfo({ ...definition, getValuePredicate: () => predicate });
    const matcher = info.get({ value: 'b' });

    expect(stringField.values.map((_, index) => matcher(index, stringField, frame, [frame]))).toEqual([
      false,
      true,
      false,
    ]);
    expect(predicate).toHaveBeenNthCalledWith(2, 'b', stringField);
  });

  it('builds the predicate once per matcher', () => {
    const getValuePredicate = jest.fn(definition.getValuePredicate);
    const info = createValueMatcherInfo({ ...definition, getValuePredicate });
    const matcher = info.get({ value: 2 });

    expect(numberField.values.filter((_, index) => matcher(index, numberField, frame, [frame]))).toEqual([2]);
    expect(getValuePredicate).toHaveBeenCalledTimes(1);
    expect(getValuePredicate).toHaveBeenCalledWith({ value: 2 });
  });
});

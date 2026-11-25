import { type Field, type FieldType } from '../../../types/dataFrame';
import { type ValueMatcherInfo } from '../../../types/transformations';
import { type ValueMatcherID } from '../ids';

import { type ValueMatcherOptionsById } from './types';

/**
 * A single value of a field, as stored in `field.values`.
 */
export type FieldValue = Field['values'][number];

/**
 * Tests a single field value. The field is passed along for matchers that depend on its config or display.
 */
export type FieldValuePredicate = (value: FieldValue, field: Field) => boolean;

/**
 * Describes a value matcher without the row lookup and applicability check that every
 * `ValueMatcherInfo` needs. The options type follows from the matcher id.
 */
export interface ValueMatcherDefinition<TId extends ValueMatcherID> {
  id: TId;
  name: string;
  description: string;
  /**
   * Field types the matcher can be used with. When omitted, the matcher applies to fields of any type.
   */
  fieldTypes?: FieldType[];
  getOptionsDisplayText: (options: ValueMatcherOptionsById[TId]) => string;
  getDefaultOptions: (field: Field) => ValueMatcherOptionsById[TId];
  /**
   * Builds the predicate that runs for every value of the matched field. It is called once per
   * matcher config, so anything derived from the options belongs here rather than in the predicate.
   */
  getValuePredicate: (options: ValueMatcherOptionsById[TId]) => FieldValuePredicate;
}

/**
 * Creates the value matcher registry item for a definition.
 */
export function createValueMatcherInfo<TId extends ValueMatcherID>(
  definition: ValueMatcherDefinition<TId>
): ValueMatcherInfo<ValueMatcherOptionsById[TId]> {
  const { fieldTypes, getValuePredicate, ...info } = definition;

  return {
    ...info,
    isApplicable: (field) => fieldTypes === undefined || fieldTypes.includes(field.type),
    get: (options) => {
      const predicate = getValuePredicate(options);
      return (valueIndex, field) => predicate(field.values[valueIndex], field);
    },
  };
}

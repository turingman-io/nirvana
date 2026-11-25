import { type FieldConfig } from '../../../types/dataFrame';
import { type ValueMatcherID } from '../ids';

/**
 * Describes a empty value matcher option.
 * @public
 */
export interface ValueMatcherOptions {}

/**
 * Describes a basic value matcher option that has a single value.
 * @public
 */
export interface BasicValueMatcherOptions<T = any> extends ValueMatcherOptions {
  value: T;
}

/**
 * Describes a range value matcher option that has a to and a from value to
 * be able to match a range.
 * @public
 */
export interface RangeValueMatcherOptions<T = any> extends ValueMatcherOptions {
  from?: T;
  to?: T;
  inclusive?: boolean;
  /** Missing bounds remain non-matching unless explicitly allowed. */
  allowOpenBounds?: boolean;
  /**
   * When set, only finite numbers are compared; all other values match this boolean.
   * Leave unset to preserve legacy numeric coercion.
   */
  includeMissing?: boolean;
}

/**
 * Describes the options of the value matcher that matches a set of raw or formatted values.
 */
export interface ValueSetOptions {
  values: unknown[];
  mode?: 'raw' | 'display';
  displayConfig?: FieldConfig;
  timeZone?: string;
  /** When specified, match null/undefined independently of formatted values. */
  includeMissing?: boolean;
  /**
   * When true, multi-valued cells match when any element is in the set: array
   * values are matched element-wise, and pill-formatted strings per rendered
   * pill. Scalar values behave exactly as before.
   */
  matchElements?: boolean;
}

/**
 * Options of each built-in value matcher, by matcher id.
 */
export interface ValueMatcherOptionsById {
  [ValueMatcherID.regex]: BasicValueMatcherOptions<string>;
  [ValueMatcherID.isNull]: ValueMatcherOptions;
  [ValueMatcherID.isNotNull]: ValueMatcherOptions;
  [ValueMatcherID.greater]: BasicValueMatcherOptions;
  [ValueMatcherID.greaterOrEqual]: BasicValueMatcherOptions;
  [ValueMatcherID.lower]: BasicValueMatcherOptions;
  [ValueMatcherID.lowerOrEqual]: BasicValueMatcherOptions;
  [ValueMatcherID.equal]: BasicValueMatcherOptions;
  [ValueMatcherID.notEqual]: BasicValueMatcherOptions;
  [ValueMatcherID.substring]: BasicValueMatcherOptions;
  [ValueMatcherID.notSubstring]: BasicValueMatcherOptions;
  [ValueMatcherID.between]: RangeValueMatcherOptions;
  [ValueMatcherID.inSet]: ValueSetOptions;
}

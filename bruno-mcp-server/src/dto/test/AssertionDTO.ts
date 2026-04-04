export type AssertionOperator =
  | "eq" | "neq"
  | "lt" | "lte" | "gt" | "gte"
  | "in" | "notIn"
  | "contains" | "notContains"
  | "startsWith" | "endsWith"
  | "matches" | "between"
  | "isNull" | "isNotNull"
  | "isDefined" | "isUndefined"
  | "isTrue" | "isFalse"
  | "isBoolean" | "isNumber" | "isString"
  | "isArray" | "isObject" | "isJson"
  | "isEmpty" | "isNotEmpty";

export interface AssertionDTO {
  expression: string;
  operator: AssertionOperator;
  value?: string | number | boolean | string[];
  enabled: boolean;
}

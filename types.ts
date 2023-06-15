export type Narrow<Type> =
  | (Type extends infer TValue ? TValue : never)
  | Extract<
    Type,
    number | string | boolean | bigint | symbol | null | undefined | []
  >;

export type Pretty<Value> = Value extends Record<PropertyKey, unknown> ? {
    [key in keyof Value]: Value[key];
  }
  : Value;

export type Narrow<Type> =
  | (Type extends infer TValue ? TValue : never)
  | Extract<
    Type,
    number | string | boolean | bigint | symbol | null | undefined | []
  >;

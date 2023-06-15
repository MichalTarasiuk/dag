type NumberToString<Value> = Value extends number ? `${Value}` : Value;

type Entries<
  UnknownObject extends Record<PropertyKey, unknown>,
  Keys extends Exclude<keyof UnknownObject, symbol> = Exclude<
    keyof UnknownObject,
    symbol
  >,
> = ReadonlyArray<
  {
    readonly [Key in NumberToString<Keys>]: readonly [
      Key,
      UnknownObject[Key],
    ];
  }[NumberToString<Keys>]
>;

export const entries = <UnknwonObject extends Record<PropertyKey, unknown>>(
  unknownObject: UnknwonObject,
) => Object.entries(unknownObject) as unknown as Entries<UnknwonObject>;

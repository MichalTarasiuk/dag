export type NumberToString<Value> = Value extends number ? `${Value}` : Value;

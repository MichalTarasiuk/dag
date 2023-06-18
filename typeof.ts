const inferType = (operand: unknown, exact = false) => {
  const type = typeof operand;

  if (type !== "object" && !exact) {
    return type;
  }

  const exactType = Object.prototype.toString
    .call(operand)
    .replace(/^\[object (\S+)\]$/, "$1");

  return exactType.toLowerCase();
};

export const isString = (value: unknown): value is string =>
  inferType(value) === "string";

export const isObject = (
  value: unknown,
): value is Record<PropertyKey, unknown> => inferType(value, true) === "object";

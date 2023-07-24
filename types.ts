type GraphKey = string;

export type GraphObjectValue = GraphKey | Promise<unknown>;

export type GraphObject = Record<string, GraphObjectValue>;

export type Graph = Record<
  GraphKey,
  Promise<unknown> | GraphObject
>;

type GraphKey = string;
type UnknownPromise = Promise<unknown>;

export type GraphObjectValue = GraphKey | UnknownPromise;

export type GraphObject = Record<string, GraphObjectValue>;

export type Graph = Record<
  GraphKey,
  UnknownPromise | GraphObject
>;

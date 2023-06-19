import { createEventEmitter } from "./event_emitter.ts";
import { isObject, isString } from "./typeof.ts";

type UnknownGraphKey = string;
type UnknownPromise = Promise<unknown>;

type UnknownGraph = Record<
  UnknownGraphKey,
  UnknownPromise | Record<string, UnknownGraphKey | UnknownPromise>
>;

export function dag<
  const Graph extends UnknownGraph,
>(
  graph: Graph,
) {
  const dagEventEmitter = createEventEmitter();

  Object.entries(graph).forEach(([graphKey, graphValue]) => {
    if (!isObject(graphValue)) {
      graphValue.then(() => dagEventEmitter.emit(graphKey, graphValue));

      return;
    }

    for (const graphObjectValue of Object.values(graphValue)) {
      if (isString(graphObjectValue)) {
        continue;
      }

      graphObjectValue.then(() =>
        dagEventEmitter.emit(graphKey, graphObjectValue)
      );
    }
  });

  const resolve = (value: unknown) => {
    return isString(value)
      ? new Promise((resolve) => dagEventEmitter.on(value, resolve))
      : value;
  };

  const get = async <GraphKey extends keyof Graph>(
    graphKey: GraphKey,
  ) => {
    const graphValue = graph[graphKey];

    if (!isObject(graphValue)) {
      await graphValue;

      return;
    }

    const graphValueEntries = Object.entries(graphValue);
    const resolvedGraphValueEntries = await Promise.all(
      graphValueEntries.map(
        async ([graphObjectKey, graphObjectValue]) => {
          return [
            graphObjectKey,
            await resolve(graphObjectValue),
          ] as const;
        },
      ),
    );

    return Object.fromEntries(resolvedGraphValueEntries);
  };

  return {
    get,
  };
}

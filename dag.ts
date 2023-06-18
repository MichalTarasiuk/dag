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
      graphValue.then(() => dagEventEmitter.emit(graphKey));

      return;
    }

    for (const graphObjectValue of Object.values(graphValue)) {
      if (isString(graphObjectValue)) {
        continue;
      }

      graphObjectValue.then(() => dagEventEmitter.emit(graphKey));
    }
  });

  const on = async <GraphKey extends keyof Graph>(
    graphKey: GraphKey,
    _listener: () => void,
  ) => {
    const graphValue = graph[graphKey];

    if (isObject(graphValue)) {
      const graphObjectValues = Object.values(graphValue);

      await Promise.all(
        graphObjectValues.map((graphValue) => {
          if (isString(graphValue)) {
            return new Promise((resolve) =>
              dagEventEmitter.on(graphValue, resolve)
            );
          }

          return graphValue;
        }),
      );

      return;
    }

    await graphValue;
  };

  return {
    on,
  };
}

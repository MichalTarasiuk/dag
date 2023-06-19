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

  const get = async <GraphKey extends keyof Graph>(
    graphKey: GraphKey,
  ) => {
    const graphValue = graph[graphKey];

    if (!isObject(graphValue)) {
      await graphValue;

      return;
    }

    const graphObjectEntries = Object.entries(graphValue);

    const resolvedGraphObjectEntries = await Promise.all(
      graphObjectEntries.map(async ([graphObjectKey, graphObjectValue]) => {
        if (isString(graphObjectValue)) {
          return [
            graphObjectKey,
            await new Promise((resolve) =>
              dagEventEmitter.on(graphObjectValue, resolve)
            ),
          ] as const;
        }

        return [graphObjectKey, graphObjectValue] as const;
      }),
    );

    return Object.fromEntries(resolvedGraphObjectEntries);
  };

  return {
    get,
  };
}

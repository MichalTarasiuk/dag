import { emitPromisesResolve } from "./emit_promises_resolve.ts";
import { createEventEmitter } from "./event_emitter.ts";
import { isObject, isString } from "./typeof.ts";
import type { UnknownGraph } from "./types.ts";

export function dag<
  const Graph extends UnknownGraph,
>(
  graph: Graph,
) {
  const dagEventEmitter = createEventEmitter();

  emitPromisesResolve(graph, dagEventEmitter);

  const resolve = (value: unknown) => {
    return isString(value)
      ? new Promise((resolve) => dagEventEmitter.on(value, resolve))
      : value;
  };

  const get = async (
    graphKey: keyof Graph,
  ) => {
    const graphValue = graph[graphKey];

    if (!isObject(graphValue)) {
      return await graphValue;
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

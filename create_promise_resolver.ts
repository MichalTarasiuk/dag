import { createEventEmitter } from "./event_emitter.ts";
import { isObject, isString } from "./typeof.ts";
import type { UnknownGraph } from "./types.ts";

export const createPromiseResolver = (graph: UnknownGraph) => {
  const eventEmitter = createEventEmitter();

  const resolve = (value: unknown) => {
    return isString(value)
      ? new Promise((resolved) => eventEmitter.on(value, resolved))
      : value;
  };

  Object.entries(graph).forEach(([graphKey, graphValue]) => {
    if (!isObject(graphValue)) {
      graphValue.then((resolved) => eventEmitter.emit(graphKey, resolved));

      return;
    }

    Promise.all(
      Object.entries(graphValue).map(
        async (
          [graphObjectKey, graphObjectValue],
        ) => [graphObjectKey, await resolve(graphObjectValue)],
      ),
    ).then((resolvedEntries) => {
      eventEmitter.emit(graphKey, Object.fromEntries(resolvedEntries));
    });
  });

  return {
    resolve,
  };
};

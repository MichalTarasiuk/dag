import { createEventEmitter } from "./event_emitter.ts";
import { isObject, isString } from "./typeof.ts";
import type { UnknownGraph } from "./types.ts";

export function emitPromisesResolve(
  graph: UnknownGraph,
  eventEmitter: ReturnType<typeof createEventEmitter>,
) {
  Object.entries(graph).forEach(([graphKey, graphValue]) => {
    if (!isObject(graphValue)) {
      graphValue.then(() => eventEmitter.emit(graphKey, graphValue));

      return;
    }

    for (const graphObjectValue of Object.values(graphValue)) {
      if (isString(graphObjectValue)) {
        continue;
      }

      graphObjectValue.then(() =>
        eventEmitter.emit(graphKey, graphObjectValue)
      );
    }
  });
}

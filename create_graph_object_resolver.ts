import { createEventEmitter } from "./event_emitter.ts";
import { isObject, isString } from "./typeof.ts";
import type { Graph, GraphObject, GraphObjectValue } from "./types.ts";

export const createGraphObjectResolver = (graph: Graph) => {
  const eventEmitter = createEventEmitter();

  const resolveGraphObjectValue = (graphObjectValue: GraphObjectValue) => {
    return isString(graphObjectValue)
      ? new Promise((resolved) => eventEmitter.on(graphObjectValue, resolved))
      : graphObjectValue;
  };

  const resolveGraphObject = async (graphObject: GraphObject) => {
    const graphObjectEntries = Object.entries(graphObject);
    const resolvedGraphObjectEntries = await Promise.all(graphObjectEntries.map(
      async (
        [graphObjectKey, graphObjectValue],
      ) =>
        [
          graphObjectKey,
          await resolveGraphObjectValue(graphObjectValue),
        ] as const,
    ));

    return Object.fromEntries(resolvedGraphObjectEntries);
  };

  Object.entries(graph).forEach(([graphKey, graphValue]) => {
    if (!isObject(graphValue)) {
      graphValue.then((resolved) => eventEmitter.emit(graphKey, resolved));

      return;
    }

    resolveGraphObject(graphValue).then((resolvedGraphObject) =>
      eventEmitter.emit(graphKey, resolvedGraphObject)
    );
  });

  return resolveGraphObject;
};

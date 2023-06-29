import { createEventEmitter } from "./event_emitter.ts";
import { isString } from "./typeof.ts";
import type { GraphObject } from "./types.ts";

export const resolveGraphObject = async (
  graphObject: GraphObject,
  eventEmitter: ReturnType<typeof createEventEmitter>,
) => {
  const graphObjectEntries = Object.entries(graphObject);

  const resolvedGraphObjectEntries = await Promise.all(graphObjectEntries.map(
    async (
      [graphObjectKey, graphObjectValue],
    ) =>
      [
        graphObjectKey,
        await (isString(graphObjectValue)
          ? new Promise((resolved) =>
            eventEmitter.on(graphObjectValue, resolved)
          )
          : graphObjectValue),
      ] as const,
  ));

  return Object.fromEntries(resolvedGraphObjectEntries);
};

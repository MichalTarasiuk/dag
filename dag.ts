import { entries } from "./entries.ts";
import { createEventEmitter } from "./event_emitter.ts";

export function dag<ValueKey extends string, GraphKey extends ValueKey>(
  value: Record<ValueKey, Array<Promise<unknown> | ValueKey>>,
) {
  const dagEventEmitter = createEventEmitter();

  entries(value).forEach(([graphKey, graphArray]) => {
    for (const graphValue of graphArray) {
      if (typeof graphValue === "string") {
        break;
      }

      graphValue.then(() => dagEventEmitter.emit(graphKey, graphValue));
    }
  });

  const get = (graphKey: GraphKey) => {
    return Promise.all(
      value[graphKey].map((dependency) => {
        if (typeof dependency === "string") {
          return new Promise((resolve) =>
            dagEventEmitter.on(dependency, resolve)
          );
        }

        return dependency;
      }),
    );
  };

  return {
    get,
  };
}

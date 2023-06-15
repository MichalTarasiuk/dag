import { entries } from "./entries.ts";
import { createEventEmitter } from "./event_emitter.ts";
import { isNumber, isString } from "./typeof.ts";

export function dag<
  ValueKey extends string | number,
  GraphKey extends ValueKey,
>(
  value: Record<ValueKey, Array<Promise<unknown> | ValueKey>>,
) {
  const dagEventEmitter = createEventEmitter();

  entries(value).forEach(([graphKey, graphArray]) => {
    for (const graphValue of graphArray) {
      if (isNumber(graphValue) || isString(graphValue)) {
        break;
      }

      graphValue.then(() => dagEventEmitter.emit(graphKey, graphValue));
    }
  });

  const get = (graphKey: GraphKey) => {
    return Promise.all(
      value[graphKey].map((dependency) => {
        if (isString(dependency)) {
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

import { entries } from "./entries.ts";
import { createEventEmitter } from "./event_emitter.ts";
import { isString } from "./is_string.ts";
import type { Narrow } from "./types.ts";

export function dag<
  const Graph extends Record<
    string,
    Array<string | Promise<unknown>>
  >,
>(
  _graph: Narrow<Graph>,
) {
  const graph = _graph as Graph;

  const dagEventEmitter = createEventEmitter();

  entries(graph).forEach(([graphKey, graphArray]) => {
    for (const graphValue of graphArray) {
      if (isString(graphValue)) {
        continue;
      }

      graphValue.then(() => dagEventEmitter.emit(graphKey));
    }
  });

  const on = async <GraphKey extends keyof Graph>(
    graphKey: GraphKey,
    callback: () => void,
  ) => {
    await Promise.all(
      graph[graphKey].map((dependency) => {
        if (isString(dependency)) {
          return new Promise((resolve) =>
            dagEventEmitter.on(dependency, resolve)
          );
        }

        return dependency;
      }),
    );

    callback();
  };

  return {
    on,
  };
}

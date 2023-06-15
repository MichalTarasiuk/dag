import { entries } from "./entries.ts";
import { createEventEmitter } from "./event_emitter.ts";
import { isNumber, isString } from "./typeof.ts";
import type { Narrow, Pretty } from "./types.ts";

type UnknownGraphKey = string | number;

const isGraphKey = (value: unknown): value is UnknownGraphKey =>
  isString(value) || isNumber(value);

type AwaitedArray<
  UnknownArray extends Array<unknown>,
> = Pretty<Array<Awaited<UnknownArray[number]>>>;

type Get<
  Graph extends Record<
    UnknownGraphKey,
    Array<Promise<unknown> | UnknownGraphKey>
  >,
  GraphKey extends keyof Graph,
> = Pretty<AwaitedArray<Graph[GraphKey]>>;

export function dag<
  const Graph extends Record<
    UnknownGraphKey,
    Array<UnknownGraphKey | Promise<unknown>>
  >,
>(
  _graph: Narrow<Graph>,
) {
  const graph = _graph as Graph;

  const dagEventEmitter = createEventEmitter();

  entries(graph).forEach(([graphKey, graphArray]) => {
    for (const graphValue of graphArray) {
      if (isGraphKey(graphValue)) {
        break;
      }

      graphValue.then(() => dagEventEmitter.emit(graphKey, graphValue));
    }
  });

  const get = <GraphKey extends keyof Graph>(
    graphKey: GraphKey,
  ) => {
    return Promise.all(
      graph[graphKey].map((dependency) => {
        if (isGraphKey(dependency)) {
          return new Promise((resolve) =>
            dagEventEmitter.on(dependency.toString(), resolve)
          );
        }

        return dependency;
      }),
    ) as unknown as Promise<Get<Graph, GraphKey>>;
  };

  return {
    get,
  };
}

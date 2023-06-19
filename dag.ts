import { emitPromisesResolve } from "./emit_promises_resolve.ts";
import { createEventEmitter } from "./event_emitter.ts";
import { isObject, isString } from "./typeof.ts";
import type { UnknownGraph, UnknownPromise } from "./types.ts";

type Get<
  Graph extends UnknownGraph,
  GraphKey extends keyof Graph,
  GraphValue extends Graph[keyof Graph] = Graph[GraphKey],
> = GraphValue extends Promise<unknown> ? GraphValue : Promise<
  {
    [key in keyof GraphValue]: GraphValue[key] extends UnknownPromise
      ? Awaited<GraphValue[key]>
      : key extends keyof Graph ? Awaited<Get<Graph, key>>
      : never;
  }
>;

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

  const getImpl = async (
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

  const get = <GraphKey extends keyof Graph>(graphKey: GraphKey) =>
    getImpl(graphKey) as Get<Graph, GraphKey>;

  return {
    get,
  };
}

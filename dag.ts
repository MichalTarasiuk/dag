import { createPromiseResolver } from "./create_promise_resolver.ts";
import { isObject } from "./typeof.ts";
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
  Graph extends UnknownGraph,
>(
  graph: Graph,
) {
  const promiseResolver = createPromiseResolver(graph);

  const getImpl = async (
    graphKey: keyof Graph,
  ) => {
    if (!Object.hasOwn(graph, graphKey)) {
      return;
    }

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
            await promiseResolver.resolve(graphObjectValue),
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

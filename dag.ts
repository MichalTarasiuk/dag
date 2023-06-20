import { createGraphObjectResolver } from "./create_graph_object_resolver.ts";
import { isObject } from "./typeof.ts";
import type { Graph as UnknownGraph } from "./types.ts";

type Get<
  Graph extends UnknownGraph,
  GraphKey extends keyof Graph,
  GraphValue extends Graph[keyof Graph] = Graph[GraphKey],
> = GraphValue extends Promise<unknown> ? GraphValue : Promise<
  {
    [key in keyof GraphValue]: GraphValue[key] extends Promise<unknown>
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
  const resolveGraphObject = createGraphObjectResolver(graph);

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

    return resolveGraphObject(graphValue);
  };

  const get = <GraphKey extends keyof Graph>(graphKey: GraphKey) =>
    getImpl(graphKey) as Get<Graph, GraphKey>;

  return {
    get,
  };
}

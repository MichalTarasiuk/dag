import { createEventEmitter } from "./event_emitter.ts";
import { resolveGraphObject } from "./resolve_graph_object.ts";
import { isObject } from "./typeof.ts";
import type { Graph as UnknownGraph } from "./types.ts";

type LooseAutocomplete<Value extends string> =
  | Value
  | Omit<string, Value>;

type Get<
  Graph extends UnknownGraph,
  GraphKey extends LooseAutocomplete<keyof Graph & string>,
  GraphValue extends Graph[keyof Graph] = Graph[GraphKey & keyof Graph],
> = GraphValue extends Promise<unknown> ? GraphValue : Promise<
  {
    [key in keyof GraphValue]: GraphValue[key] extends Promise<unknown>
      ? Awaited<GraphValue[key]>
      : GraphValue[key] extends keyof Graph
        ? Awaited<Get<Graph, GraphValue[key] & string>>
      : never;
  }
>;

export function dag<
  const Graph extends UnknownGraph,
  UnknownGraphKey extends keyof Graph & string = keyof Graph & string,
>(
  graph: Graph,
) {
  const eventEmitter = createEventEmitter();

  Object.entries(graph).forEach(([graphKey, graphValue]) => {
    if (!isObject(graphValue)) {
      graphValue.then((resolved) => eventEmitter.emit(graphKey, resolved));

      return;
    }

    resolveGraphObject(graphValue, eventEmitter).then((resolvedGraphObject) =>
      eventEmitter.emit(graphKey, resolvedGraphObject)
    );
  });

  const getImpl = async (
    _graphKey: LooseAutocomplete<UnknownGraphKey>,
  ) => {
    const graphKey = _graphKey as string;

    if (!Object.hasOwn(graph, graphKey)) {
      return;
    }

    const graphValue = graph[graphKey];

    if (!isObject(graphValue)) {
      return await graphValue;
    }

    return resolveGraphObject(graphValue, eventEmitter);
  };

  const get = <
    GraphKey extends LooseAutocomplete<UnknownGraphKey>,
  >(
    graphKey: GraphKey,
  ) => getImpl(graphKey) as Get<Graph, GraphKey & string>;

  return {
    get,
  };
}

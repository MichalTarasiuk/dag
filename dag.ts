import { createEventEmitter } from "./event_emitter.ts";

const graph = (
  value: Record<string, Array<Promise<unknown> | string>>,
) => {
  const dagEventEmitter = createEventEmitter();

  Object.entries(value).forEach(([graphKey, graphArray]) => {
    for (const graphValue of graphArray) {
      if (typeof graphValue === "string") {
        break;
      }

      graphValue.then(() => dagEventEmitter.emit(graphKey, graphValue));
    }
  });

  const get = (name: string) => {
    return Promise.all(
      value[name].map((dependency) => {
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
};

export { graph };

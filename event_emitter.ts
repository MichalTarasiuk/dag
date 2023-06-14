type Listener = (...parameters: unknown[]) => unknown;

type EventEmitter = Map<string, Array<Listener>>;

export const createEventEmitter = () => {
  const eventEmitter: EventEmitter = new Map();

  const emit = (name: string, ...args: unknown[]) => {
    eventEmitter.get(name)?.forEach((listener) => listener(...args));
  };

  const on = (name: string, listener: Listener) => {
    if (!eventEmitter.has(name)) {
      eventEmitter.set(name, []);
    }

    eventEmitter.get(name)?.push(listener);

    return {
      off: () => {
        eventEmitter.get(name)?.push(listener);
      },
    };
  };

  return {
    emit,
    on,
  };
};

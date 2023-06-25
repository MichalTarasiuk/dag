import { assert } from "https://deno.land/std@0.192.0/_util/asserts.ts";
import { dag } from "./dag.ts";
import { isObject } from "./typeof.ts";

Deno.test("dependency graph", async () => {
  const isEmptyObject = (value: Record<PropertyKey, unknown>) =>
    Object.keys(value).length === 0;

  const build = { name: "build command", success: true };

  const isBuild = (value: unknown): value is typeof build => value === build;
  const runBuild = () =>
    new Promise<{ success: boolean }>((resolve) => {
      setTimeout(resolve, 1000, build);
    });

  const dependencyTree: Record<string, Record<string, string>> = {
    debugger: {},
    core: { lib: "lib" },
    lib: {},
    react: { lib: "lib", core: "core" },
    vue: { lib: "lib", core: "core" },
    angular: { debugger: "debugger", core: "core" },
  };
  const dependencyTreeKeys = Object.keys(dependencyTree);
  const entriesDependencyTree = Object.entries(dependencyTree);

  const entriesGraph = entriesDependencyTree.map(
    ([dependencyName, dependencies]) => {
      return [
        dependencyName,
        isEmptyObject(dependencies) ? runBuild() : dependencies,
      ] as const;
    },
  );

  const graph = dag(Object.fromEntries(entriesGraph));

  const result = await Promise.all(
    dependencyTreeKeys.map(async (dependencyName) => {
      const graphItem = await graph.get(dependencyName);

      return (isBuild(graphItem) ? graphItem : await runBuild());
    }),
  );

  assert(
    result.every(isBuild),
    "each result item should be build command result",
  );
});

Deno.test("Counter", async () => {
  const sum = (a: unknown, b: unknown) =>
    typeof a === "number" && typeof b === "number" ? a + b : 0;

  const deepValues = <Obj extends Record<PropertyKey, unknown>>(
    obj: Obj,
  ): unknown[] =>
    Object.values(obj).flatMap((value) =>
      isObject(value) ? deepValues(value) : value
    );

  const counterObj = {
    "1": Promise.resolve(1),
    "2": {
      value1: "1",
      value2: "1",
    },
    "3": {
      value1: "1",
      value2: "2",
    },
    "4": {
      value1: "2",
      value2: "2",
    },
    "5": {
      value1: "2",
      value2: "3",
    },
  } as const;
  const counterObjKeys = Object.keys(counterObj);

  const graph = dag(counterObj);

  const result = await Object.keys(counterObj).reduce(
    async (collector, graphKey) => {
      const graphValue = await graph.get(graphKey);

      const nextValue = isObject(graphValue)
        ? deepValues(graphValue).reduce<number>(sum, 0)
        : graphValue;

      return await collector + nextValue;
    },
    Promise.resolve(0),
  );
  const expectedResult = counterObjKeys.map(Number).reduce(sum, 0);

  assert(result === expectedResult);
});

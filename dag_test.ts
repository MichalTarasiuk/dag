import { assert } from "https://deno.land/std@0.192.0/_util/asserts.ts";
import { dag } from "./dag.ts";

const isEmptyObject = (value: Record<PropertyKey, unknown>) =>
  Object.keys(value).length === 0;

Deno.test("dependency graph", async () => {
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

      graphItem;

      return (isBuild(graphItem) ? graphItem : await runBuild());
    }),
  );

  console.log(result);

  assert(
    result.every(isBuild),
    "each result item should be build command result",
  );
});

import { assert } from "https://deno.land/std@0.192.0/_util/asserts.ts";
import { dag } from "./dag.ts";

Deno.test("dependency graph", async () => {
  const arrayToObject = <Value extends PropertyKey>(array: Array<Value>) =>
    Object.fromEntries(array.map((value) => [value, String(value)] as const));

  const build = { name: "build command", success: true };

  const isBuild = (value: unknown): value is typeof build => value === build;
  const runBuild = () =>
    new Promise<{ success: boolean }>((resolve) => {
      setTimeout(resolve, 1000, build);
    });

  const dependencyTree: Record<string, Array<string>> = {
    debugger: [],
    core: ["lib"],
    lib: [],
    react: ["lib", "core"],
    vue: ["lib", "core"],
    angular: ["debugger", "core"],
  };
  const dependencyNames = Object.keys(dependencyTree);
  const entriesDependencyTree = Object.entries(dependencyTree);

  const entriesGraph = entriesDependencyTree.map(
    ([dependencyName, dependencies]) => {
      return [
        dependencyName,
        dependencies.length ? arrayToObject(dependencies) : runBuild(),
      ] as const;
    },
  );

  const graph = dag(Object.fromEntries(entriesGraph));

  const result = await Promise.all(
    dependencyNames.map(async (dependencyName) => {
      const graphItem = await graph.get(dependencyName);

      return (isBuild(graphItem) ? graphItem : await runBuild());
    }),
  );

  assert(
    result.every(isBuild),
    "each result item should be build command result",
  );
});

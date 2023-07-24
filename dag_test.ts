import { assert } from "https://deno.land/std@0.192.0/_util/asserts.ts";
import { dag } from "./dag.ts";

Deno.test("dependency graph", async () => {
  type Build = typeof build;
  const build = { name: "build command", success: true };

  const isBuild = (value: unknown): value is Build => value === build;
  const runBuild = () =>
    new Promise<Build>((resolve) => {
      setTimeout(resolve, 1000, build);
    });

  const dependencyTree: Record<
    string,
    ReturnType<typeof runBuild> | Record<string, string>
  > = {
    debugger: runBuild(),
    core: { lib: "lib" },
    lib: runBuild(),
    react: { lib: "lib", core: "core" },
    vue: { lib: "lib", core: "core" },
    angular: { debugger: "debugger", core: "core" },
  };

  const graph = dag(dependencyTree);

  assert(
    (await Promise.all(
      Object.keys(dependencyTree).map(async (dependencyName) => {
        const graphItem = await graph.get(dependencyName);

        return (isBuild(graphItem) ? graphItem : await runBuild());
      }),
    )).every(isBuild),
    "each result item should be build command result",
  );
});

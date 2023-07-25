# [dag](https://en.wikipedia.org/wiki/Directed_acyclic_graph)

```ts
type Build = typeof build;

const buildTime = 1_000;
const build = { name: "build", success: true };

const runBuild = () =>
  new Promise<Build>((resolve) => setTimeout(resolve, buildTime, build));

const dependencyTree: Record<string, Promise<Build> | Record<string, string>> =
  {
    debugger: runBuild(),
    core: { lib: "lib" },
    lib: runBuild(),
    react: { lib: "lib", core: "core" },
    vue: { lib: "lib", core: "core" },
    angular: { debugger: "debugger", core: "core" },
  };

const graph = dag(dependencyTree);

await Promise.all(
  Object.keys(dependencyTree).map(async (dependencyName) => {
    if ((await graph.get(dependencyName)) === build) {
      return;
    }

    await runBuild();
  })
);
```

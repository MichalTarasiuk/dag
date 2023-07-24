# dag - in progress

```ts
type Build = typeof build;

const build = { name: "build result", success: true };
const runBuild = () =>
  new Promise<Build>((resolve) => setTimeout(resolve, 1000, build));

const dependencyTree: Record<string, Promise<Build> | Record<string, string>> =
  {
    debugger: runBuild(),
    core: { lib: "lib" },
    lib: runBuild(),
    react: { lib: "lib", core: "core" },
    vue: { lib: "lib", core: "core" },
    angular: { debugger: "debugger", core: "core" },
  };
const dependencyTreeKeys = Object.keys(dependencyTree);

const graph = dag(dependencyTree);

await Promise.all(
  dependencyTreeKeys.map(async (dependencyName) => {
    if ((await graph.get(dependencyName)) === build) {
      return;
    }

    await runBuild();
  })
);
```

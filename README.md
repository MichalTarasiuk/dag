# dag

in progress...

```ts
const graph = dag({
  user: {
    name: 'name',
    age: 'age',
  },
  name: {
    firstname: Promise.resolve('Michał'),
    lastname: Promise.resolve('Tarasiuk'),
  },
  age: Promise.resolve(19),
});

await graph.get('user');
```

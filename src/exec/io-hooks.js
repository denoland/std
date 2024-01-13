export const isolate = () => globalThis['@@io-worker-hooks']

export const actions = (...args) => isolate().actions(...args)
export const writeJS = (...args) => isolate().writeJS(...args)
export const writeFile = (...args) => isolate().writeFile(...args)
export const readJS = (...args) => isolate().readJS(...args)
export const readFile = (...args) => isolate().readFile(...args)

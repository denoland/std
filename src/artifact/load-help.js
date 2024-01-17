export default async (path) => {
  const { default: help } = await import(`../helps/${path}.js`)
  return help
}

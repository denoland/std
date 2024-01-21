import posix from 'path-browserify'

export const load = async (path) => {
  // TODO use the actual filesystem
  // TODO cache the responses ?
  const { default: help } = await import(`../helps/${path}.js`)
  return help
}

export const loadHelps = async () => {
  // TODO do some format checking
  const helps = []
  const imports = import.meta.glob('../helps/*.js', { eager: true })

  for (const _path in imports) {
    const name = posix.basename(_path, posix.extname(_path))
    const { default: help } = imports[_path]
    helps.push({ name, help })
  }
  return helps
}

export const loadDir = async () => {
  const files = []
  const imports = import.meta.glob('../helps/*', { eager: true, as: 'raw' })
  for (const path in imports) {
    const name = posix.basename(path)
    files.push({ name, file: imports[path] })
  }
  return files
}

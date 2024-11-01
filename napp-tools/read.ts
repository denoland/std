import { assert } from '@std/assert'
import { parse } from '@std/jsonc'
import { nappSchema } from './nappSchema.ts'

// TODO check to being able to import the json config file directly as an import
// this means can use dynamic reading but also can just import statically ?

export const readNappConfig = async (name: string) => {
  const url = import.meta.resolve(name)
  assert(url.endsWith('mod.ts'), 'napp must end in mod.ts')
  const configUrl = url.substring(0, url.length - 'mod.ts'.length) +
    'napp.jsonc'
  const file = await readUrl(configUrl)
  const config = parse(file)

  return nappSchema.parse(config)
}

const readUrl = async (urlString: string) => {
  const url = new URL(urlString)
  if (url.protocol === 'file:') {
    return await Deno.readTextFile(url.pathname)
  } else if (url.protocol === 'http:' || url.protocol === 'https:') {
    // TODO use jsr registry tools to pull in the whole module for reading
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }
    return await response.text()
  } else {
    throw new Error(`Unsupported protocol: ${url.protocol}`)
  }
}

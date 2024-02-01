import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { ls, readJS } from '@io/io-hooks.js'

export const api = {
  load: {
    description:
      'load the help by name.  Will convert the help to a path using `/helps/${name}.json`, and then will return the json object from loading and parsing this file',
    type: 'object',
    additionalProperties: false,
    required: ['help'],
    properties: {
      help: {
        description: 'the name of the help',
        type: 'string',
      },
    },
  },
  loadAll: {
    description: 'load all the helps',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}

export const functions = {
  load: async ({ help }) => {
    const js = await readJS(`/helps/${help}.json`)
    // TODO do some format checking
    return js
  },
  loadAll: async () => {
    const helps = []
    const files = await ls('/helps')
    for (const file of files) {
      if (file.endsWith('.json')) {
        const name = posix.basename(file, posix.extname(file))
        const help = await functions.load({ help: name })
        helps.push({ name, help })
      }
    }
    return helps
  },
}

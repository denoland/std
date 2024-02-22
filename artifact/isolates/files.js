export const api = {
  write: {
    description:
      'Overwrite or Add a file with optional contents.  If the contents are omitted, the file will be overwritten or created with zero contents.',
    type: 'object',
    additionalProperties: false,
    required: ['path'],
    properties: {
      path: { type: 'string', description: 'the absolute path to the file' },
      contents: {
        type: 'string',
        description: 'the contents of the file to be written',
      },
    },
  },
  ls: {
    description: 'list files',
    type: 'object',
    additionalProperties: false,
    properties: {
      path: {
        type: 'string',
        description: 'the absolute path to the directory you want to list',
      },
    },
  },
  read: {
    description: 'Read a file.  It will be returned to you as a string',
    type: 'object',
    additionalProperties: false,
    required: ['path'],
    properties: {
      path: {
        type: 'string',
        description: 'the absolute path to the file you want to read',
      },
    },
  },
  update: {
    description:
      'Update a file using a regex and a replacement string.  The number of occurrences replaced will be returned to you as an integer.  If you want to append something to a file, you can use a regex to match the end of the file and replace it with the contents you want to append.  To delete portions of a file, you can use a regex to match the contents you want to delete and replace it with an empty string.',
    type: 'object',
    additionalProperties: false,
    required: ['path', 'regex', 'replacement'],
    properties: {
      path: {
        type: 'string',
        description: 'the absolute path to the file you want to update',
      },
      regex: {
        type: 'string',
        description: 'a regular expression string',
      },
      replacement: {
        type: 'string',
        description: 'the replacement string',
      },
    },
  },
}

export const functions = {
  write: async ({ path, contents = '' }, api) => {
    debug('add', path, contents)
    await api.write(path, contents)
    return `added ${path} with length: ${contents.length}`
  },
  ls: async ({ path }, api) => {
    debug('ls')
    const result = await api.ls(path)
    return result
  },
  read: async ({ path }, api) => {
    return await api.read(path)
    // reading should be async, writing should be sync
  },
  update: async ({ path, regex, replacement }, api) => {
    debug('update', path, regex, replacement)
    const contents = await api.read(path)
    const matches = contents.match(new RegExp(regex, 'g')) || []
    const result = contents.replace(new RegExp(regex, 'g'), replacement)
    await api.write(path, result)
    return matches.length
  },
}

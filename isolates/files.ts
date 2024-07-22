import { Debug } from '@utils'
import { IA, print } from '@/constants.ts'
const log = Debug('AI:files')

export const api = {
  write: {
    description:
      'Write to a file with optional contents.  Will overwrite existing files.  Will create all required parent directories. Returns the number of characters written in the operation',
    type: 'object',
    additionalProperties: false,
    required: ['path'],
    properties: {
      path: { type: 'string', description: 'the relative path to the file' },
      content: {
        type: 'string',
        description: 'the contents of the file to be written',
      },
    },
  },
  ls: {
    description:
      'List files for a given path. Returns file names with directory names ending in "/".  The root ("/") is actually just ".".  To count the number of files instead of list them, set "count" to true.  To include hidden files in the list or count, set "all" to true.',
    type: 'object',
    additionalProperties: false,
    properties: {
      path: {
        type: 'string',
        description: 'the relative path to the directory you want to list',
        default: '.',
      },
      count: {
        type: 'boolean',
        description:
          'count the number of files and return this instead of the names of the files',
      },
      all: {
        type: 'boolean',
        description:
          'include all files including hidden files in the operation',
      },
    },
  },
  read: {
    description: 'Read a file.  It will be returned as a string.',
    type: 'object',
    additionalProperties: false,
    required: ['path'],
    properties: {
      path: {
        type: 'string',
        description: 'the relative path to the file you want to read',
      },
    },
  },
  update: {
    description:
      'Update a file using a regex and a replacement string.  The number of occurrences replaced will be returned to you as an integer.  If you want to append something to a file, you can use a regex to match the end of the file and replace it with the contents you want to append.  To delete portions of a file, you can use a regex to match the contents you want to delete and replace it with an empty string.  Path must be relative.',
    type: 'object',
    additionalProperties: false,
    required: ['path', 'regex', 'replacement'],
    properties: {
      path: {
        type: 'string',
        description: 'the relative path to the file you want to update',
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
  rm: {
    // TODO extend to support glob patterns
    description: 'Remove a file.  This is recursive.',
    type: 'object',
    additionalProperties: false,
    required: ['path'],
    properties: {
      path: {
        type: 'string',
        description: 'the relative path to the file you want to remove',
      },
    },
  },
  mv: {
    description: 'Move a file efficiently. This is a rename operation.',
    type: 'object',
    additionalProperties: false,
    required: ['from', 'to'],
    properties: {
      from: {
        type: 'string',
        description: 'the relative path to the file you want to move',
      },
      to: {
        type: 'string',
        description: 'the relative path to the new location of the file',
      },
    },
  },
  search: {
    description:
      'Search for a file or directory.  Returns the relative path to the first match.',
    type: 'object',
    additionalProperties: false,
    required: ['query'],
    properties: {
      query: {
        type: 'string',
        description:
          'the relative path to the file or directory you want to find',
      },
    },
  },
}
interface SearchResult {
  path: string
  description: string
}
export type Api = {
  write: (
    params: { path: string; content?: string },
  ) => Promise<{ charactersWritten: number }>
  ls: (
    params: { path?: string; count?: boolean; all?: boolean },
  ) => Promise<string[] | number>
  read: (params: { path: string }) => Promise<string>
  update: (params: Update) => Promise<{ matchesUpdated: number }>
  rm: (params: { path: string }) => Promise<void>
  mv: (params: { from: string; to: string }) => Promise<void>
  search: (params: { query: string }) => Promise<SearchResult[]>
}
export const functions = {
  // TODO this should be a full mirror of the IsolateApi functions
  write: (params: { path: string; content?: string }, api: IA) => {
    const { path, content = '' } = params
    log('add', path, content)
    api.write(path, content)
    return { charactersWritten: content.length }
  },
  ls: async (
    params: { path?: string; count?: boolean; all?: boolean },
    api: IA,
  ) => {
    const { path = '.', count } = params
    log('ls', path)
    let result = await api.ls(path)
    if (!params.all) {
      result = result.filter((name) => !name.startsWith('.'))
    }
    if (count) {
      return result.length
    }
    return result
  },
  read: async (params: { path: string }, api: IA) => {
    const { path } = params
    return await api.read(path)
  },
  update: async (params: Update, api: IA) => {
    const { path, regex, replacement } = params
    log('update', path, regex, replacement)
    const contents = await api.read(path)
    const matches = contents.match(new RegExp(regex, 'g')) || []
    const result = contents.replace(new RegExp(regex, 'g'), replacement)
    api.write(path, result)
    return { matchersUpdated: matches.length }
  },
  rm: (params: { path: string }, api: IA) => {
    const { path } = params
    log('rm', path)
    api.delete(path)
  },
  mv: (params: { from: string; to: string }, api: IA) => {
    const { from, to } = params
    log('mv', from, to)
    return api.mv(from, to)
  },
  search: (params: { query: string }, api: IA) => {
    const { query } = params
    log('search', query, print(api.pid))

    // to start with, this function should just return all the file paths ?
    // or, read everything in, and make a call based on the contents of all ?

    // read all files and then pump into context, who cares about the price ?
    // or vector store them all based on dir hashes ?
    return api.ls()
  },
}

interface Update {
  path: string
  regex: string
  replacement: string
}

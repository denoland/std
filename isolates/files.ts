import { Debug } from '@utils'
import { IsolateApi, ProcessOptions } from '@/constants.ts'
const log = Debug('AI:files')

export const api = {
  write: {
    description:
      'Write to a file with optional contents.  Will overwrite existing files.  Will create all required parent directories.  Path must be relative.  Returns the number of characters written in the operation',
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
      'List files for a given path. Returns file names with directory names ending in "/".  Path must be relative.  The root ("/") is actually just ".".  To count the number of files instead of list them, set "count" to true.  To include hidden files in the list or count, set "all" to true.',
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
    description:
      'Read a file.  It will be returned to you as a string.  Path must be relative.',
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
    description: 'Remove a file.  Path must be relative.  This is recursive.',
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
}
export type Api = {
  write: (
    params: { path: string; content?: string },
    // TODO check when this ever needed to be a branch call
    opts?: ProcessOptions,
  ) => Promise<number>
  ls: (
    params: { path?: string; count?: boolean; all?: boolean },
  ) => Promise<string[] | number>
  read: (params: { path: string }) => Promise<string>
  update: (params: Update) => Promise<number>
  rm: (params: { path: string }) => Promise<void>
}
export const functions = {
  // TODO this should be a full mirror of the IsolateApi functions
  write: (params: { path: string; content?: string }, api: IsolateApi) => {
    const { path, content = '' } = params
    log('add', path, content)
    api.write(path, content)
    return content.length
  },
  ls: async (
    params: { path?: string; count?: boolean; all?: boolean },
    api: IsolateApi,
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
  read: async (params: { path: string }, api: IsolateApi) => {
    const { path } = params
    return await api.read(path)
  },
  update: async (params: Update, api: IsolateApi) => {
    const { path, regex, replacement } = params
    log('update', path, regex, replacement)
    const contents = await api.read(path)
    const matches = contents.match(new RegExp(regex, 'g')) || []
    const result = contents.replace(new RegExp(regex, 'g'), replacement)
    api.write(path, result)
    return matches.length
  },
  rm: (params: { path: string }, api: IsolateApi) => {
    const { path } = params
    log('rm', path)
    api.delete(path)
  },
}

interface Update {
  path: string
  regex: string
  replacement: string
}

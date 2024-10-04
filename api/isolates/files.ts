import { reasoning, ToApiType } from '../types.ts'
import { z } from 'zod'

export const parameters = {
  write: z.object({
    reasoning,
    path: z.string().describe('the relative path to the file'),
    content: z.string().optional().describe(
      'the contents of the file to be written',
    ),
  }).describe(
    'Write to a file with optional contents.  Will overwrite existing files.  Will create all required parent directories. Returns the number of characters written in the operation',
  ),
  ls: z.object({
    reasoning,
    path: z.string().optional().describe(
      'the relative path to the directory you want to list',
    ),
    count: z.boolean().optional().describe(
      'count the number of files and return this instead of the names of the files',
    ),
    all: z.boolean().optional().describe(
      'include all files including hidden files in the operation',
    ),
  }).describe(
    'List files for a given path. Returns file names with directory names ending in "/".  The root ("/") is actually just ".".  To count the number of files instead of list them, set "count" to true.  To include hidden files in the list or count, set "all" to true.',
  ),
  read: z.object({
    reasoning,
    path: z.string().describe(
      'the relative path to the file you want to read',
    ),
  }).describe('Read a file.  The contents will be returned as a string.'),
  update: z.object({
    reasoning: reasoning.describe(
      'the brief step by step reasoning why this regex was chosen and what it is trying to achieve',
    ),
    expectedMatches: z.number().int().gt(0).describe(
      'the expected number of matches for the regex',
    ),
    path: z.string().describe(
      'the relative path to the file you want to update',
    ),
    regex: z.string().describe('a regular expression string'),
    replacement: z.string().describe('the replacement string'),
  }).refine(({ regex }) => {
    try {
      new RegExp(regex)
      return true
    } catch (error) {
      return !error
    }
  })
    .describe(
      'Update a file using a regex and a replacement string.  The number of occurrences replaced will be returned to you as an integer.  If you want to append something to a file, you can use a regex to match the end of the file and replace it with the contents you want to append.  To delete portions of a file, you can use a regex to match the contents you want to delete and replace it with an empty string.  Path must be relative.',
    ),
  rm: z.object({
    reasoning,
    path: z.string().describe(
      'the relative path to the file you want to remove',
    ),
  }).describe('Remove a file.  This is recursive.'),
  mv: z.object({
    reasoning,
    from: z.string().describe(
      'the relative path to the file you want to move',
    ),
    to: z.string().describe(
      'the relative path to the new location of the file',
    ),
  }).describe('Move a file efficiently. This is a rename operation.'),
  cp: z.object({
    reasoning,
    from: z.string().describe(
      'the relative path to the file you want to copy',
    ),
    to: z.string().describe(
      'the relative path to the new location of the file',
    ),
  }).describe('Copy a file efficiently.'),
  search: z.object({
    reasoning,
    query: z.string().describe(
      'the relative path to the file or directory you want to find',
    ),
  }).describe(
    'Search for a file or directory.  Returns the relative path to the first match.',
  ),
}
export const returns = {
  /** The number of bytes written */
  write: z.object({
    charactersWritten: z.number(),
  }),
  ls: z.union([z.array(z.string()), z.number()]),
  read: z.string(),
  /** The number of occurrences replaced */
  update: z.object({ matchesUpdated: z.number() }),
  rm: z.void(),
  mv: z.void(),
  cp: z.void(),
  search: z.array(
    z.object({ path: z.string(), description: z.string() }),
  ),
}

export type Api = ToApiType<typeof parameters, typeof returns>

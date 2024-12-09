import { z } from 'zod'
const reasoning = z.string().array().optional().describe(
  'reasoning for the operation',
)

export const write = {
  parameters: z.object({
    reasoning,
    path: z.string().describe('the relative path to the file'),
    content: z.string().optional().describe(
      'the contents of the file to be written',
    ),
  }).describe(
    'Write to a file with optional contents.  Will overwrite existing files.  Will create all required parent directories. Returns the number of characters written in the operation',
  ),
  returns: z.object({
    charactersWritten: z.number(),
  }),
  throws: z.object({
    name: z.literal('FileNotFound'),
    message: z.literal('The file was not found'),
  }),
}

export const ls = {
  parameters: z.object({
    reasoning,
    path: z.string().optional().describe(
      'the path to the directory you want to list',
    ),
    count: z.boolean().optional().describe(
      'count the number of files and return this instead of the names of the files',
    ),
    all: z.boolean().optional().describe(
      'include all files including hidden files in the operation',
    ),
  }).describe(
    'List files for a given path. Returns file names with directory names ending in "/". The root ("/") is actually just ".". To count the number of files instead of list them, set "count" to true. To include hidden files in the list or count, set "all" to true.',
  ),
  returns: z.union([z.array(z.string()), z.number()]),
}

export const read = {
  parameters: z.object({
    reasoning,
    path: z.string().describe(
      'the path to the file you want to read',
    ),
  }).describe('Read a file. The contents will be returned as a string.'),
  returns: z.string(),
}

export const rm = {
  parameters: z.object({
    reasoning,
    path: z.string().describe(
      'the path to the file you want to remove',
    ),
  }).describe('Remove a file. This is recursive on directories.'),
  returns: z.void(),
}

export const mv = {
  parameters: z.object({
    reasoning,
    from: z.string().describe(
      'the path to the file you want to move',
    ),
    to: z.string().describe(
      'the path to the new location of the file',
    ),
  }).describe('Move a file efficiently. This is a rename operation.'),
  returns: z.void(),
}

export const cp = {
  parameters: z.object({
    reasoning,
    from: z.string().describe(
      'the path to the file you want to copy',
    ),
    to: z.string().describe(
      'the path to the new location of the file',
    ),
  }).describe('Copy a file efficiently.'),
  returns: z.void(),
}

export const search = {
  parameters: z.object({
    reasoning,
    query: z.string().describe(
      'the path to the file or directory you want to find',
    ),
  }).describe(
    'Search for a file or directory. Returns the path to the first match.',
  ),
  returns: z.array(
    z.object({ path: z.string(), description: z.string() }),
  ),
}

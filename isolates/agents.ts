import { Functions, print, ToApiType } from '@/constants.ts'
import { Debug } from '@utils'
import { z } from 'zod'
import * as files from './files.ts'
import { loadString } from '@/isolates/utils/load-agent.ts'
const log = Debug('AI:agents')

export const parameters = {
  search: z.object({ query: z.string() }).describe(
    'The highly descriptive natural language search query saying what the agent you want should be capable of doing.  Will return a ranked array of results, where each result will have a path to the agent file, the name of the agent, and a reason why it was selected, and optionally an avatar representing the agent.',
  ),
  switch: z.object({
    reasoning: z.array(z.string()),
    path: z.string().describe('The path to the agent file to switch to'),
  }).describe(
    'Called with step by step reasoning how the selected path was decided upon, and the path to the new agent to call',
  ),
  write: files.parameters.write.describe(
    'Write an agent file with the provided contents.  The contents will be checked for formatting and errors before being written.',
  ),
  update: files.parameters.update.describe(
    'Update an agent file using a regex and a replacement string.  The number of occurrences replaced will be returned to you as an integer.  If you want to append something to a file, you can use a regex to match the end of the file and replace it with the contents you want to append.  To delete portions of a file, you can use a regex to match the contents you want to delete and replace it with an empty string.  If the contents are not formatted correctly as an agent, an error will be thrown.',
  ),
  read: files.parameters.read.describe(
    'Read an agent file.  The contents will be returned as a string. If the contents are not formatted correctly as an agent, an error will be thrown.',
  ),
}
export const returns = {
  search: z.array(
    z.object({
      path: z.string(),
      name: z.string(),
      reason: z.string(),
      imageUrl: z.string().optional(),
    }),
  ),
  switch: z.null(),
  write: files.returns.write,
  update: files.returns.update,
  read: files.returns.read,
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  search: async ({ query }, api) => {
    // TODO make this the same as the files search function

    // read all the agent files in from disk
    // make an AI call to select the best ones and rank them
    // also to provide a reason why they were selected
    // if nothing found or an error, return null

    // this can be an AI call where we force the AI to call the function with
    // something
    // this is just using AI to help do coding tasks, as opposed to agents
    // so agents are defined by their interaction aspect
    // interaction implies state
    log('search', query, print(api.pid))
    const cheapResults = await api.ls('agents')
    return cheapResults.map((path) => ({
      path: `agents/${path}`,
      name: path,
      reason: 'no reason available',
    }))
  },
  switch: ({ path }, api) => {
    log('switch', path, print(api.pid))
    return null
  },
  write: async ({ path, content = '' }, api) => {
    log('write', path, content)
    await loadString(path, content, api)
    return files.functions.write({ path, content }, api)
  },
  update: async ({ path, regex, replacement }, api) => {
    log('update', path, regex, replacement)
    const { result: content, matches } = files.replace(path, regex, replacement)
    await loadString(path, content, api)
    await files.functions.write({ path, content }, api)
    return { matchesUpdated: matches.length }
  },
  read: async ({ reasoning, path }, api) => {
    log('read', path, print(api.pid))
    const contents = await files.functions.read({ reasoning, path }, api)
    await loadString(path, contents, api)
    return contents
  },
}

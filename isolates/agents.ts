import {
  agentConfigSchema,
  agentSchema,
  Functions,
  print,
  reasoning,
  ToApiType,
} from '@/constants.ts'
import { Debug } from '@utils'
import { z } from 'zod'
import * as files from './files.ts'
import { loadString } from '@/isolates/utils/load-agent.ts'
const log = Debug('AI:agents')

export const parameters = {
  search: z.object({ reasoning, query: z.string() }).describe(
    'The highly descriptive natural language search query saying what the agent you want should be capable of doing.  Will return a ranked array of results, where each result will have a path to the agent file, the name of the agent, and a reason why it was selected, and optionally an avatar representing the agent.',
  ),
  switch: z.object({
    reasoning,
    path: z.string().describe('The path to the agent file to switch to'),
    alsoConsidered: z.array(
      z.object({
        path: z.string(),
        reason: z.string().describe(
          'reason why this agent was considered but rejected',
        ),
      }),
    ).max(3),
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
  config: z.object({
    reasoning,
    path: z.string().describe('path to the agent file you want to update'),
    description: z.string().optional().describe('description of the agent'),
    config: agentConfigSchema.optional().describe(
      'configuration of the agent',
    ),
    runner: agentSchema.shape.runner.optional().describe('runner of the agent'),
    commands: agentSchema.shape.commands.optional().describe(
      'commands of the agent',
    ),
  }).describe(
    'Update the configuration of the agent.  To remove an item, set it to "undefined"',
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
  config: z.void(),
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
    return files.functions.write({ reasoning: [], path, content }, api)
  },
  update: async ({ path, regex, replacement }, api) => {
    log('update', path, regex, replacement)
    const { result: content, matches } = files.replace(path, regex, replacement)
    await loadString(path, content, api)
    await files.functions.write({ reasoning: [], path, content }, api)
    return { matchesUpdated: matches.length }
  },
  read: async ({ reasoning, path }, api) => {
    log('read', path, print(api.pid))
    const contents = await files.functions.read({ reasoning, path }, api)
    await loadString(path, contents, api)
    return contents
  },
  config: async ({ path, description, config, runner, commands }, api) => {
    // TODO handle deletion of sections
    log('config', path, description, config, runner, commands)
    const contents = await files.functions.read({ reasoning: [], path }, api)
    const agent = await loadString(path, contents, api)
    if (description !== undefined) {
      agent.description = description
    }
    if (config !== undefined) {
      agent.config = config
    }
    if (runner !== undefined) {
      agent.runner = runner
    }
    if (commands !== undefined) {
      agent.commands = commands
    }

    // TODO handle the writing of the file with the instructions

    await files.functions.write({
      reasoning: [],
      path,
      content: agent.toString(),
    }, api)
  },
}

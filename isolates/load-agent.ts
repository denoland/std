import { assert, posix } from '@utils'
import { AGENT_RUNNERS, IsolateApi, Triad } from '@/constants.ts'
import { type Agent } from '@/constants.ts'
import matter from 'gray-matter'

export const api = {
  load: {
    description:
      'load an agent from a relative filepath. The file must be a markdown file, ending in ".md"',
    type: 'object',
    additionalProperties: false,
    required: ['path'],
    properties: {
      path: {
        description: 'the relative filepath of the agent',
        type: 'string',
        pattern: '^(\\.\\/|[^\\/].*\\/)*[^\\/]+\\.md$',
      },
    },
  },
  loadAll: {
    description: 'load all the agents from a directory',
    type: 'object',
    additionalProperties: false,
    required: ['dir'],
    properties: {
      dir: {
        description: 'the relative directory path',
        type: 'string',
        pattern: '^(\\.\\/|[^\\/][^\\/]*)$',
      },
    },
  },
}
export interface Api {
  load: (params: { path: string }) => Promise<Agent>
  loadAll: (
    params: { dir: string },
  ) => Promise<{ path: string; agent: Agent }[]>
}

export const functions = {
  load: async ({ path }: { path: string }, api: IsolateApi) => {
    assert(path.endsWith('.md'), 'path must end with .md')
    const string = await api.read(path)
    const { data, content } = matter(string.trim())
    assert(typeof content === 'string', 'content missing')
    const defaults = {
      runner: AGENT_RUNNERS.CHAT,
      instructions: '',
    }

    const { pid, commit } = api
    const source: Triad = { path, pid, commit }
    const instructions = content.trim()
    const name = posix.basename(path, posix.extname(path))
    const loaded: Agent = { ...defaults, ...data, name, instructions, source }

    assertAgent(loaded)
    return loaded
  },
  loadAll: async ({ dir }: { dir: string }, api: IsolateApi) => {
    // TODO provide globs
    const agents: { name: string; agent: Agent }[] = []
    const files = await api.ls(dir)
    for (const file of files) {
      if (file.endsWith('.md')) {
        const path = posix.basename(file, posix.extname(file))
        const agent = await functions.load({ path }, api)
        agents.push({ name: agent.name, agent })
      }
    }
    return agents
  },
}

const assertAgent = (agent: Agent) => {
  if (!(typeof agent.instructions === 'string')) {
    throw new Error('instructions must be an array')
  }
  const { runner } = agent
  if (runner !== AGENT_RUNNERS.CHAT) {
    throw new Error('runner must be chat')
  }
  if (agent.description && typeof agent.description !== 'string') {
    throw new Error('description must be a string')
  }
  if (agent.config) {
    const { config } = agent
    if (
      config.model && config.model !== 'gpt-3.5-turbo' &&
      config.model !== 'gpt-4-turbo' && config.model !== 'gpt-4o'
    ) {
      throw new Error('model must be gpt-3.5-turbo or gpt-4-turbo or gpt-4o')
    }
    if (
      agent.config.temperature &&
      (agent.config.temperature < 0 || agent.config.temperature > 1)
    ) {
      throw new Error('temperature must be between 0 and 1')
    }
  }
  if (agent.commands && !Array.isArray(agent.commands)) {
    throw new Error('commands must be an array')
  }
}

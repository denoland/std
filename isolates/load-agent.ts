import merge from 'lodash.merge'
import { assert, posix } from '@utils'
import { AGENT_RUNNERS, Functions, IA, Triad } from '@/constants.ts'
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

export const functions: Functions<Api> = {
  load: async ({ path }, api) => {
    assert(path.endsWith('.md'), 'path must end with .md')
    const string = await api.read(path)
    const { data, content } = matter(string.trim())
    assert(typeof content === 'string', 'content missing')
    const config: Agent['config'] = {
      model: 'gpt-4o-mini',
      tool_choice: 'auto',
      // must be false for strict function calling
      parallel_tool_calls: true,
    }
    const defaults = {
      runner: AGENT_RUNNERS.CHAT,
      instructions: '',
      config,
      commands: [],
    }

    merge(defaults, data)

    const { pid, commit } = api
    const source: Triad = { path, pid, commit }
    const instructions = await expandLinks(content.trim(), api)
    const name = posix.basename(path, posix.extname(path))
    const loaded: Agent = { ...defaults, name, instructions, source }

    assertAgent(loaded)
    return loaded
  },
  loadAll: async ({ dir }, api) => {
    // TODO provide globs
    const agents: { path: string; agent: Agent }[] = []
    const files = await api.ls(dir)
    for (const file of files) {
      if (file.endsWith('.md')) {
        const path = posix.basename(file, posix.extname(file))
        const agent = await functions.load({ path }, api)
        agents.push({ path, agent })
      }
    }
    return agents
  },
}

const assertAgent = (agent: Agent) => {
  // TODO use a zod schema to assert
  if (!(typeof agent.instructions === 'string')) {
    throw new Error('instructions must be an array')
  }
  // TODO check max length of instructions
  // https://platform.openai.com/docs/api-reference/assistants/createAssistant#assistants-createassistant-instructions
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
      config.model !== 'gpt-4-turbo' && config.model !== 'gpt-4o' &&
      config.model !== 'gpt-4o-mini'
    ) {
      throw new Error('invalid model: ' + config.model)
    }
    if (
      agent.config.temperature &&
      (agent.config.temperature < 0 || agent.config.temperature > 2)
    ) {
      throw new Error('temperature must be between 0 and 2')
    }
  }
  if (!agent.commands || !Array.isArray(agent.commands)) {
    throw new Error('commands must be an array')
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(agent.name)) {
    throw new Error('name must be alphanumeric: ' + agent.name)
  }
}
const expandLinks = async (content: string, api: IA, path: string[] = []) => {
  content = content.trim()
  const links = extractLinks(content)
  const contents = await loadContent(links, api, path)
  return replaceLinksWithContent(content, links, contents)
}
const loadContent = async (links: string[], api: IA, path: string[]) => {
  const contents = new Map()
  for (const link of links) {
    if (path.includes(link)) {
      throw new Error('circular reference: ' + path.join(' -> '))
    }
    const content = await api.read(link)
    contents.set(link, await expandLinks(content, api, path.concat(link)))
  }
  return contents
}

const extractLinks = (content: string): string[] => {
  const linkRegex = /\[.*?\]\((.*?\.md)\)/g
  const plain = content.split(codeBlockRegex).filter((_, i) => i % 2 === 0)

  const links = []
  for (const section of plain) {
    let match
    while ((match = linkRegex.exec(section)) !== null) {
      links.push(match[1])
    }
  }
  return links
}

const codeBlockRegex = /(```[\s\S]*?```|`[^`\n]*`)/g
const replaceLinksWithContent = (
  content: string,
  links: string[],
  contents: Map<string, string>,
) => {
  const parts = content.split(codeBlockRegex)
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      for (const link of links) {
        const linkRegex = new RegExp(`\\[.*?\\]\\(${link}\\)`, 'g')
        const resolved = contents.get(link)
        assert(resolved, 'missing content for link: ' + link)
        parts[i] = parts[i].replace(linkRegex, resolved)
      }
    }
  }

  return parts.join('')
}

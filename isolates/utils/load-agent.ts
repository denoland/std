import merge from 'lodash.merge'
import { assert, posix } from '@utils'
import { AGENT_RUNNERS, agentSchema, IA, Triad } from '@/constants.ts'
import { type Agent } from '@/constants.ts'
import matter from 'gray-matter'

export const loadString = async (path: string, string: string, api: IA) => {
  const name = posix.basename(path, posix.extname(path))
  const { data, content } = matter(string.trim())
  assert(typeof content === 'string', 'content missing')
  const config: Agent['config'] = {
    model: 'gpt-4o-mini',
    tool_choice: 'auto',
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
  const instructions = await expandLinks(content, api)
  const o1Checker = agentSchema.refine((data) => {
    if (data.instructions) {
      if (['o1-preview', 'o1-mini'].includes(data.config.model)) {
        return !data.instructions
      }
    }
    return true
  }, 'instructions are not allowed for this model')
  return o1Checker.parse({ ...defaults, name, instructions, source })
}

export const load = async (path: string, api: IA) => {
  assert(path.endsWith('.md'), 'path must end with .md')
  const string = await api.read(path)
  return loadString(path, string, api)
}

export const loadAll = async (dir: string, api: IA) => {
  // TODO provide globs
  const agents: { path: string; agent: Agent }[] = []
  const files = await api.ls(dir)
  for (const file of files) {
    if (file.endsWith('.md')) {
      const path = posix.basename(file, posix.extname(file))
      const agent = await load(path, api)
      agents.push({ path, agent })
    }
  }
  return agents
}

const expandLinks = async (content: string, api: IA, path: string[] = []) => {
  content = content.trim()
  const links = extractLinks(content)
  const contents = await loadContent(links, api, path)
  const result = replaceLinksWithContent(content, links, contents)
  return result.trim()
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

import { Debug, delay, expect } from '@utils'
import { Functions, IA, pidSchema } from '@/constants.ts'
import { PID } from '@/constants.ts'
import { withMeta } from '@/api/types.ts'
const log = Debug('AI:io-fixture')

export const api = {
  write: {
    description: 'write a file',
    type: 'object',
    required: ['path', 'content'],
    additionalProperties: false,
    properties: { path: { type: 'string' }, content: { type: 'string' } },
  },
  writeSlow: {
    description: 'write a file one character at a time',
    type: 'object',
    required: ['path', 'content'],
    additionalProperties: false,
    properties: {
      path: { type: 'string' },
      content: { type: 'string' },
      delayMs: { type: 'integer', minimum: 0 },
    },
  },
  error: {
    description: 'throw an error',
    type: 'object',
    additionalProperties: false,
    required: ['message'],
    properties: {
      message: { type: 'string' },
    },
  },
  branch: {
    description: 'make a new branch',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  compound: {
    description: 'call another function',
    type: 'object',
    additionalProperties: false,
    properties: { target: pidSchema },
  },
  parallel: {
    description: 'call local in parallel',
    type: 'object',
    additionalProperties: false,
    properties: { count: { type: 'integer', minimum: 1 } },
  },
  squared: {
    description: 'call parallel in parallel',
    type: 'object',
    additionalProperties: false,
    properties: {
      count: { type: 'integer', minimum: 1 },
      multiplier: { type: 'integer', minimum: 1 },
    },
  },
  fileAccumulation: {
    description: 'accumulate file writes',
    type: 'object',
    required: ['path', 'content', 'count'],
    additionalProperties: false,
    properties: {
      path: { type: 'string' },
      content: { type: 'string' },
      count: { type: 'integer', minimum: 1 },
    },
  },
  loopAccumulation: {
    description: 'loop accumulating file writes',
    type: 'object',
    required: ['path', 'content', 'count'],
    additionalProperties: false,
    properties: {
      path: { type: 'string' },
      content: { type: 'string' },
      count: { type: 'integer', minimum: 1 },
    },
  },
  pong: {
    description: 'ping the AI',
    type: 'object',
    properties: {},
  },
  local: {
    description: 'ping locally',
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  ping: {
    description: 'ping with a message, where the message will be returned',
    type: 'object',
    properties: { message: { type: 'string' } },
    additionalProperties: false,
  },
  touch: {
    description: 'touch a file in the root directory',
    type: 'object',
    properties: {
      count: { type: 'integer', minimum: 1 },
      prefix: { type: 'string' },
      suffix: { type: 'string' },
    },
    required: ['count'],
    additionalProperties: false,
  },
}
export type Api = {
  write: (params: { path: string; content: string }) => void
  writeSlow: (
    params: { path: string; content: string; delayMs: number },
  ) => Promise<void>
  fileAccumulation: (
    params: { path: string; content: string; count: number },
  ) => Promise<void>
  loopAccumulation: {
    (params: { path: string; content: string; count: number }): Promise<void>
  }
  local: () => string
  branch: (_: void) => Promise<string>
  ping: (params: { message?: string }) => string | undefined
  pong: () => string
  error: (params: { message: string }) => void
  compound: (params: { target?: PID }) => Promise<string>
  parallel: (params: { count: number }) => Promise<string[]>
  squared: (
    params: { count: number; multiplier: number },
  ) => Promise<string[][]>
  touch: (params: { count: number; prefix?: string; suffix?: string }) => void
}
export const functions: Functions<Api> = {
  write: ({ path, content }, api) => {
    log('write', path, content)
    api.write(path, content)
  },
  async writeSlow({ path, content, delayMs }, api) {
    log('writeSlow', path, content, delayMs)
    let string = ''
    for (const char of content) {
      string += char
      api.write(path, string)
      await delay(delayMs)
    }
    // TODO extend to test with large strings so we can check performance impact
  },
  error: ({ message }) => {
    log('error', message)
    throw new Error(message)
  },
  branch: async (_, api) => {
    log('branch')
    const { pong } = await api.actions<Api>('io-fixture', { branch: true })
    const result = await pong()
    return result
  },
  compound: async ({ target }, api) => {
    log('compound target:', target)
    const { pong } = await api.actions<Api>('io-fixture', { target })
    const result = await pong()
    return result
  },
  parallel: async ({ count }, api) => {
    const { local } = await api.actions<Api>('io-fixture', { branch: true })
    const promises = []
    for (let i = 0; i < count; i++) {
      promises.push(local())
    }
    return Promise.all(promises)
  },
  squared: async ({ count, multiplier }, api) => {
    const { parallel } = await api.actions<Api>('io-fixture', { branch: true })
    const promises = []
    for (let i = 0; i < multiplier; i++) {
      promises.push(parallel({ count }))
    }
    return Promise.all(promises)
  },
  fileAccumulation: async (
    params: { path: string; content: string; count: number },
    api: IA,
  ) => {
    log('fileAccumulation', params)
    const { path, content, count } = params
    const { fileAccumulation } = await api.actions<Api>('io-fixture')
    const nextCount = count - 1
    let file = ''
    if (await api.exists(params.path)) {
      file = await api.read(params.path)
    }
    file += `down: ${count} ${content}\n`
    api.write(path, file)
    if (nextCount) {
      const { parent } = await withMeta(
        fileAccumulation({ ...params, count: nextCount }),
      )
      expect(parent).not.toEqual(api.commit)
    } else {
      log('bottomed out')
    }
    file = await api.read(path)
    log('read:', api.commit, '\n' + file)
    file += `up: ${count} ${content}\n`
    api.write(path, file)
    log('wrote:', '\n' + file)
  },
  loopAccumulation: async (
    params: { path: string; content: string; count: number },
    api: IA,
  ) => {
    log('loopAccumulation', params)
    log('commit', api.commit)
    const { path, content: baseContent, count } = params
    api.write(path)

    const { write } = await api.actions<Api>('io-fixture')
    let loop = count
    do {
      const current = await api.read(path)
      log('current', current)
      const content = current + loop + '\n' + baseContent + '\n'
      log('pre commit', api.commit)
      const { parent } = await withMeta(write({ path, content }))
      expect(parent).not.toEqual(api.commit)
      log('post commit', api.commit)
    } while (loop--)
  },
  pong: () => {
    log('pong')
    return 'remote pong'
  },
  local: () => {
    log('local')
    return 'local reply'
  },
  ping: ({ message }) => {
    log('ping', message)
    return message
  },
  touch: ({ count, prefix = '', suffix = '' }, api) => {
    log('touch', count, prefix, suffix)
    for (let i = 0; i < count; i++) {
      const path = `${prefix}${i}${suffix}`
      api.write(path)
    }
  },
}

import { Debug, delay } from '@utils'
import { IsolateApi, pidSchema } from '@/constants.ts'
import { PID } from '@/constants.ts'
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
      delay: { type: 'integer', minimum: 0 },
    },
  },
  error: {
    description: 'throw an error',
    type: 'object',
    additionalProperties: false,
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
  write: (params: { path: string; content: string }) => Promise<void>

  fileAccumulation: (
    params: { path: string; content: string; count: number },
  ) => Promise<void>
  loopAccumulation: {
    (params: { path: string; content: string; count: number }): Promise<void>
  }
}
export const functions = {
  write: (params: { path: string; content: string }, api: IsolateApi) => {
    log('write', params)
    api.write(params.path, params.content)
  },
  async writeSlow(
    params: { path: string; content: string; delay: number },
    api: IsolateApi,
  ) {
    log('writeSlow', params)
    let string = ''
    for (const char of params.content) {
      string += char
      api.write(params.path, string)
      await delay(10)
    }
    // TODO extend to test with large strings so we can check performance impact
  },
  error: ({ message }: { message: string }) => {
    log('error', message)
    throw new Error(message)
  },
  branch: async (_: object, api: IsolateApi) => {
    log('branch')
    const { pong } = await api.actions('io-fixture')
    const result = await pong({}, { branch: true })
    return result
  },
  compound: async (params: { target?: PID }, api: IsolateApi) => {
    const { target } = params
    log('compound target:', target)
    const { pong } = await api.actions('io-fixture', target)
    const result = await pong({})
    return result
  },
  parallel: async (params: { count: number }, api: IsolateApi) => {
    const { local } = await api.actions('io-fixture')
    const promises = []
    for (let i = 0; i < params.count; i++) {
      promises.push(local({}, { branch: true }))
    }
    return Promise.all(promises)
  },
  squared: async (
    params: { count: number; multiplier: number },
    api: IsolateApi,
  ) => {
    const { parallel } = await api.actions('io-fixture')
    const promises = []
    for (let i = 0; i < params.multiplier; i++) {
      promises.push(parallel({ count: params.count }, { branch: true }))
    }
    return Promise.all(promises)
  },
  fileAccumulation: async (
    params: { path: string; content: string; count: number },
    api: IsolateApi,
  ) => {
    log('fileAccumulation', params)
    const { path, content, count } = params
    const { fileAccumulation } = await api.actions('io-fixture')
    const nextCount = count - 1
    let file = ''
    if (await api.exists(params.path)) {
      file = await api.read(params.path)
    }
    file += `down: ${count} ${content}\n`
    api.write(path, file)
    if (nextCount) {
      await fileAccumulation({ ...params, count: nextCount })
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
    api: IsolateApi,
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
      await write({ path, content })
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
  touch: (
    params: { count: number; prefix: string; suffix: string },
    api: IsolateApi,
  ) => {
    const { count, prefix = '', suffix = '' } = params
    log('touch', params)
    for (let i = 0; i < count; i++) {
      const path = `${prefix}${i}${suffix}`
      api.write(path)
    }
  },
}

import { Debug, delay, expect } from '@utils'
import { Functions, pidSchema, ToApiType } from '@/constants.ts'
import { withMeta } from '@/api/types.ts'
import { z } from 'zod'
const log = Debug('AI:io-fixture')

export const parameters = {
  write: z.object({
    path: z.string(),
    content: z.string(),
  }),
  writeSlow: z.object({
    path: z.string(),
    content: z.string(),
    delayMs: z.number().int().min(0),
  }).describe('write a file one character at a time'),
  error: z.object({ message: z.string() }).describe('throw an error'),
  branch: z.object({ data: z.string().optional() }),
  compound: z.object({ target: pidSchema }).describe('call another function'),
  parallel: z.object({ count: z.number().int().min(1) }).describe(
    'call local in parallel',
  ),
  squared: z.object({
    count: z.number().int().min(1),
    multiplier: z.number().int().min(1),
  }).describe('call parallel in parallel'),
  fileAccumulation: z.object({
    path: z.string(),
    content: z.string(),
    count: z.number().int().min(1),
  }).describe('accumulate file writes'),
  loopAccumulation: z.object({
    path: z.string(),
    content: z.string(),
    count: z.number().int().min(1),
  }).describe('loop accumulating file writes'),
  pong: z.object({ data: z.string().optional() }),
  local: z.object({}).describe('ping locally'),
  ping: z.object({ message: z.string().optional() }).describe(
    'ping with a message',
  ),
  touch: z.object({
    count: z.number().int().min(1),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  }).describe('touch a file in the root directory'),
}
export const returns = {
  write: z.void(),
  writeSlow: z.void(),
  error: z.void(),
  branch: z.string(),
  compound: z.string(),
  parallel: z.array(z.string()),
  squared: z.array(z.array(z.string())),
  fileAccumulation: z.void(),
  loopAccumulation: z.void(),
  pong: z.string(),
  local: z.string(),
  ping: z.string().optional(),
  touch: z.void(),
}

export type Api = ToApiType<typeof parameters, typeof returns>

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
  branch: async ({ data }, api) => {
    log('branch')
    const { pong } = await api.actions<Api>('io-fixture', { branch: true })
    const result = await pong({ data })
    return result
  },
  compound: async ({ target }, api) => {
    log('compound target:', target)
    const { pong } = await api.actions<Api>('io-fixture', { target })
    const result = await pong({})
    return result
  },
  parallel: async ({ count }, api) => {
    const { local } = await api.actions<Api>('io-fixture', { branch: true })
    const promises = []
    for (let i = 0; i < count; i++) {
      promises.push(local({}))
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
  fileAccumulation: async ({ path, content, count }, api) => {
    log('fileAccumulation', path, content, count)
    const { fileAccumulation } = await api.actions<Api>('io-fixture')
    const nextCount = count - 1
    let file = ''
    if (await api.exists(path)) {
      file = await api.read(path)
    }
    file += `down: ${count} ${content}\n`
    api.write(path, file)
    if (nextCount) {
      const { parent } = await withMeta(
        fileAccumulation({ path, content, count: nextCount }),
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
  loopAccumulation: async ({ path, content: baseContent, count }, api) => {
    log('loopAccumulation', path, baseContent, count)
    log('commit', api.commit)
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
  pong: ({ data = 'remote pong' }) => {
    log('pong')
    return data
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

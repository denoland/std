import { basename, dirname, fromFileUrl } from '@std/path'
import { z, type ZodSchema } from 'zod'
import get from 'lodash.get'
import set from 'lodash.set'
import { Debug } from '@utils'
const log = Debug('AI:mocker')
type TestContext = Deno.TestContext

const id = z.string()

const baseTestRecord = z.object({
  recordings: z.record(id, z.array(z.unknown())),
})

type TestRecord = z.infer<typeof baseTestRecord> & {
  children?: Record<string, TestRecord>
}

/** The on disk format for recordings during testing */
const testRecordSchema: z.ZodType<TestRecord> = baseTestRecord.extend({
  children: z.lazy(() => z.record(testRecordSchema)).optional(),
})
const fileSchema = z.record(testRecordSchema)

export const mockCreator = <T extends z.ZodTypeAny>(messageSchema: T) => {
  type Subscriber = (message: z.infer<typeof messageSchema> | undefined) => void
  type Mock = {
    inject: (id: string, message: z.infer<typeof messageSchema>) => void
    next: (id: string) => z.infer<typeof messageSchema> | undefined
    useRecorder: (id: string, t: TestContext) => void
    store: (id: string, message: z.infer<typeof messageSchema>) => void
    teardown: (id: string) => void
    /** Trigger a callback when the mock is called */
    subscribe: (id: string, callback: Subscriber) => void
  }

  const subscribers = new Map<string, Set<Subscriber>>()
  const injections = new Map<string, z.infer<typeof messageSchema>[]>()
  const recordings = new Map<string, TestContext>()

  const mock: Mock = {
    next: (id) => {
      const messages = injections.get(id) || []
      const payload = messages.shift()
      const callbacks = subscribers.get(id) || new Set()
      // TODO allow callbacks to return an override payload
      callbacks.forEach((callback) => callback(payload))
      return payload
    },
    inject: (id, payload) => {
      if (recordings.has(id)) {
        throw new Error('Cannot inject while recording')
      }
      const messages = injections.get(id) || []
      messages.push(payload)
      injections.set(id, messages)
      // TODO throw an error if used with the recording feature
    },
    useRecorder: (id, t) => {
      if (injections.has(id) || recordings.has(id)) {
        throw new Error('recorder already active')
      }
      const saved = readMessages(id, t, messageSchema)
      for (const recording of saved) {
        mock.inject(id, recording)
      }
      recordings.set(id, t)
    },
    store: (id, message) => {
      const context = recordings.get(id)
      if (!context) {
        log('no recording context for id: %s', id)
        return
      }

      const saved = readMessages(id, context, messageSchema)
      saved.push(message)
      log('storing', saved)
      writeRecordingFile(id, context, saved, messageSchema)
    },
    teardown: (id) => {
      injections.delete(id)
      subscribers.delete(id)
      recordings.delete(id)
    },
    subscribe: (id, callback) => {
      const callbacks = subscribers.get(id) || new Set()
      callbacks.add(callback)
      subscribers.set(id, callbacks)
    },
  }
  Object.freeze(mock)
  return mock
}

const readMessages = <T extends ZodSchema>(
  id: string,
  t: TestContext,
  schema: T,
) => {
  const records = readRecordFile(t)
  const path = getPath(id, t)
  log('path', path)

  return schema.array().parse(get(records, path, []))
}

export const getFilename = (t: TestContext, withDirCreation?: boolean) => {
  const origin = t.origin
  const url = origin + '.json'
  const path = fromFileUrl(url)
  const parent = dirname(path)
  const base = basename(path)
  const snapPath = `${parent}/__snapshots__/${base}`

  if (withDirCreation) {
    try {
      Deno.mkdirSync(dirname(snapPath))
    } catch (_) {
      log('error creating directory', snapPath)
    }
  }

  log('filename', snapPath)
  return snapPath
}

const writeRecordingFile = <T extends ZodSchema>(
  id: string,
  t: TestContext,
  messages: z.infer<T>[],
  schema: T,
) => {
  const withDirCreation = true
  const filename = getFilename(t, withDirCreation)
  const path = getPath(id, t)
  log('writing to path', path)

  const records = readRecordFile(t)
  set(records, path, schema.array().parse(messages))

  const pretty = JSON.stringify(records, null, 2)
  Deno.writeTextFileSync(filename, pretty)
}

const readRecordFile = (t: TestContext) => {
  const filename = getFilename(t)
  let contents = fileSchema.parse({})
  try {
    const data = Deno.readTextFileSync(filename)
    contents = fileSchema.parse(JSON.parse(data))
  } catch (error) {
    if (error instanceof Error) {
      log('error reading recording file', error.message)
    }
  }
  return contents
}

export const removeSnapshotsFile = (t: TestContext) => {
  const filename = getFilename(t)
  try {
    Deno.removeSync(filename)
  } catch (_) {
    log('error removing file')
  }
}

const getPath = (id: string, t: TestContext) => {
  const path = [t.name, 'recordings', id]
  while (t.parent) {
    path.unshift(t.parent.name, 'children')
    t = t.parent
  }
  log('path', path)
  return path
}

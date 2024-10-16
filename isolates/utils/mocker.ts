import { basename, dirname, fromFileUrl } from '@std/path'
import { z, ZodError } from 'zod'
import get from 'lodash.get'
import set from 'lodash.set'
import { Debug } from '@utils'
const log = Debug('AI:mocker')
type TestContext = Deno.TestContext

let testContext: TestContext | undefined
export const isMockingRunning = () => !!testContext

const id = z.string()

export const mockCreator = <T extends z.ZodTypeAny>(messageSchema: T) => {
  type Subscriber = (
    message: z.infer<typeof messageSchema> | undefined,
    id: string,
  ) => void
  type Mock = {
    inject: (id: string, message: z.infer<typeof messageSchema>) => void
    next: (id: string) => z.infer<typeof messageSchema> | undefined
    useRecorder: (t: TestContext) => void
    store: (id: string, message: z.infer<typeof messageSchema>) => void
    teardown: () => void
    /** Trigger a callback when the mock is called */
    subscribe: (callback: Subscriber) => void
  }

  const subscribers = new Set<Subscriber>()
  const injections = new Map<string, z.infer<typeof messageSchema>[]>()

  const mock: Mock = {
    next: (id) => {
      const messages = injections.get(id) || []
      const raw = messages.shift()
      const message = raw === undefined ? raw : messageSchema.parse(raw)
      // TODO allow callbacks to return an override payload
      subscribers.forEach((callback) => callback(message, id))
      return message as z.infer<typeof messageSchema>
    },
    inject: (id, payload) => {
      if (!testContext) {
        throw new Error('no test context to inject into')
      }
      const messages = injections.get(id) || []
      messages.push(payload)
      injections.set(id, messages)
    },
    useRecorder: (t) => {
      if (testContext) {
        throw new Error('recorder already active')
      }
      testContext = t

      const saved = readRecordings(t)
      for (const [id, recording] of Object.entries(saved)) {
        for (const message of recording) {
          mock.inject(id, message)
        }
      }
    },
    store: (id, message) => {
      // TODO require a store key, so multiple functions can store with
      // different schemas but using the same id
      if (!testContext) {
        log('no recording context for id: %s', id)
        return
      }
      const parsed = messageSchema.parse(message)
      const saved = readRecordings(testContext)
      const messages = saved[id] || []
      messages.push(parsed)
      log('storing', messages)
      writeRecordingFile(id, testContext, messages)
    },
    teardown: () => {
      injections.clear()
      subscribers.clear()
      testContext = undefined
    },
    subscribe: (callback) => {
      subscribers.add(callback)
    },
  }
  Object.freeze(mock)
  return mock
}

const readRecordings = (t: TestContext) => {
  const allRecords = readRecordFile(t)
  const path = getRecordingsPath(t)

  log('path', path)
  const recordings = get(allRecords, path, {})
  log('recordings', recordings)

  const recordingsSchema = z.record(id, z.unknown().array())
  return recordingsSchema.parse(recordings)
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

const writeRecordingFile = (
  id: string,
  t: TestContext,
  messages: unknown[],
) => {
  const withDirCreation = true
  const filename = getFilename(t, withDirCreation)
  const path = getRecordsPathById(id, t)
  log('writing to path', path)

  const records = readRecordFile(t)
  set(records, path, messages)

  const pretty = JSON.stringify(records, null, 2)
  Deno.writeTextFileSync(filename, pretty)
}

const readRecordFile = (t: TestContext) => {
  const baseTestRecord = z.object({
    recordings: z.record(id, z.unknown().array()).optional(),
  })
  type TestRecord = z.infer<typeof baseTestRecord> & {
    children?: Record<string, TestRecord>
  }
  const testRecordSchema: z.ZodType<TestRecord> = baseTestRecord.extend({
    children: z.lazy(() => z.record(testRecordSchema)).optional(),
  })
  const fileSchema = z.record(testRecordSchema)

  const filename = getFilename(t)
  let contents = fileSchema.parse({})
  try {
    const data = Deno.readTextFileSync(filename)
    contents = fileSchema.parse(JSON.parse(data))
  } catch (error) {
    if (error instanceof Error) {
      if (error instanceof ZodError) {
        throw error
      }
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
const getRecordsPathById = (id: string, t: TestContext) => {
  const path = getRecordingsPath(t)
  return [...path, id]
}
const getRecordingsPath = (t: TestContext) => {
  const path = [t.name, 'recordings']
  while (t.parent) {
    path.unshift(t.parent.name, 'children')
    t = t.parent
  }
  log('getRecordingsPath', path)
  return path
}

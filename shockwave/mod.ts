import type { JsonValue } from '@artifact/api/actions'

type Outcome = {
  ok: boolean
  value: JsonValue
}

type Task = {
  type: 'task'
  id: number
  options: Options
}

type Amplifer = {
  type: 'amplifier'
  start: number
  count: number
  options: Options
}

type Options = {
  /** Controls task batch size and queue load. When reached, amplification
   * actions will delay themselves */
  batchSize?: number

  /** Use web cache to retrieve task data when available */
  useCache?: boolean

  /** Optional ID for tracking job progress and statistics. Required for
   * watching intermediate results */
  jobId?: string

  /** Time in ms after which results expire from storage */
  expireResults?: number

  /** Optional reducer to process results */
  reducer?: {
    /** Process an array of results into a single value */
    fn: (results: Outcome[]) => Promise<JsonValue>
    /** Process results in original task order */
    ordered?: boolean
    /** How to handle errors: 'skip' = ignore failed tasks, 'stop' = halt on error */
    handleErrors?: 'skip' | 'stop'
  }

  /** Trigger reduction at amplification boundaries for memory efficiency */
  reduceOnAmplify?: boolean
}

export const createQueueListener = <T>(processor: (params: T) => {}) => {
  // receive a message from the queue

  // if amplifier, break apart the tasks into further batches
}

export const enqueue = (
  tasks: Record<string, JsonValue>[],
  options: Options,
) => {
  // send a message to the queue

  // generate a jobid

  // assert the jobid is not taken already

  // write the tasks to the db

  // send off the first amplifier task, so executes close to the db
}

import type { JsonValue } from '@artifact/api/actions'

type Task = {
  type: 'task'
  /** What task id needs to be fetched from the db */
  id: number
  options: Options
}
type Amplifer = {
  type: 'amplifier'
  start: number
  count: number
  options: Options
}

// make a listener to attach to the db, and make an action creator to send in
// actions

// ? would we automatically add an amplification action wrapper

type Options = {
  batchSize?: number
  peakQueueSize?: number
  /** can choose to use the web cache to retrieve task data from, which can be
   * faster in some cases  */
  useCache?: boolean
  /** If a jobid is supplied, then intermediate results can be watched for,
   * using this jobId.  */
  jobId?: string
  /** If configured, task results will be set to expire after this time, which
   * avoids needing to clean the database by deleting them. */
  expireResults?: number
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

# Shockwave

Rapid idempotent fan out of tasks using deno KV Queues.

## Features

1. Exactly once task invocation
1. KV Queue overload recovery
1. Fast time to first task
1. Fast time to peak concurrency using amplification actions
1. Nestable - shockwave can be called from within a shockwave task
1. Realtime statistics
1. Optional reduce function
1. Configurable ramp rate to stay friendly to your infrastructure providers
1. Oversize job batches
1. Billing aware
1. Peak queue size limits

### Exactly once invocation

By using atomic commits in Deno KV, the results of execution will be returned
exactly once. At worst, the execution may have run twice, but only one result
will be returned.

### Queue overload recovery

Deno kv queues have a maximum queue length of 100,000 items. If shockwave tries
to add more items than this and receives an error, it will retry with
exponential backoff. It will watch its own queue length statistics to try to
insert the exact amount of load each time, but will still tolerate competing
queue usage from other applications.

### Amplification actions

Technique is that it will create amplification actions for any batches it needs
to send off, then in the last batch it will execute direct task items, then it
will start the final task.

This means that amplifications take place quickly and rapidly, as well as task
executions, but there is also an initial task that is started, resulting in a
good time to first task metric.

### Deterministic execution

Invoking shockwave with the exact same parameters will always give the exact
same results.

### Peak queue size limits

By setting amplification actions to redispatch themselves with a delay if the
queue high water mark is reached, the processing rate can be delayed without
compromising reliability of execution.

### Realtime statistics

When a jobId is provided, ongoing statistics can be watched to get live
feedback. These stats are returned back with the job in their final form with
some basic statistic analysis on mean times, ramp times, invocation counts, etc.

Tracked statistics are:

- **Time to first task** How many ms since the job arrived until the first task
  was started

- **Time to last task** How many ms since the job arrived until the LAST task
  was started

- **Peak task rate** What was the highest observed concurrent task execution
  rate

- **Peak queue length**

  What was the longest the queue was observed to be

- **Child shockwaves**

  IDs for gathering statistics on shockwaves that were created from within this
  shockwave. The shockwave task is not counted as a task itself, but all its
  individual components are used in statistics.

### Result Reduction

Shockwave supports processing task results through reducer functions that
operate on results as they become available, or processing all results at the
end. The reducer configuration allows for:

1. **Ordered Processing**
   - Optionally process results in the exact order tasks were dispatched
   - Uses KV store for buffering out-of-order results
   - Configurable error handling: skip errors or stop on first error

2. **Amplification Boundary Processing**
   - Optionally trigger reduction at amplification boundaries
   - Natural batching based on the fan-out structure
   - Helps maintain memory efficiency during large fan-outs

Example configuration:

```typescript
const options = {
  // Controls batch size for task processing
  batchSize?: number,
  
  // Use web cache for task data when available
  useCache?: boolean,
  
  // Optional ID for tracking progress and statistics
  jobId?: string,
  
  // Time in ms after which results expire
  expireResults?: number,
  
  // Optional reducer configuration
  reducer?: {
    // Function that processes an array of task results
    fn: async (results: Outcome[]) => {
      return results.reduce((acc, curr) => {
        if (curr.ok) return acc + curr.value
        return acc
      }, 0)
    },
    // Whether to maintain task dispatch order
    ordered?: boolean,
    // How to handle failed tasks: 'skip' or 'stop'
    handleErrors?: 'skip' | 'stop'
  },
  
  // Whether to trigger reduction at amplification boundaries
  reduceOnAmplify?: boolean
}
```

The reducer function is automatically invoked when:

- An amplification boundary is hit (if reduceOnAmplify is true)
- All tasks have completed

Results are stored in Deno KV to maintain scalability and handle any potential
memory constraints during processing.

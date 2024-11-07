# Shockwave

Rapid idempotent fan out of tasks using deno KV Queues.

Features:

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

## Exactly once invocation

By using atomic commits in Deno KV, the results of execution will be returned
exactly once. At worst, the execution may have run twice, but only one result
will be returned.

## Queue overload recovery

Deno kv queues have a maximum queue length of 100,000 items. If shockwave tries
to add more items than this and receives an error, it will retry with
exponential backoff. It will watch its own queue length statistics to try to
insert the exact amount of load each time, but will still tolerate competing
queue usage from other applications.

## Amplification actions

Technique is that it will create amplification actions for any batches it needs
to send off, then in the last batch it will execute direct task items, then it
will start the final task.

This means that amplifications take place quickly and rapidly, as well as task
executions, but there is also an initial task that is started, resulting in a
good time to first task metric.

## Deterministic execution

Invoking shockwave with the exact same parameters will always give the exact
same results.

## Oversize job batches

Due to the maximum atomic data write that deno kv can handle, sometimes the task
definitions need to be written out in several steps before the jobs begin. This
is supported by way of a loader function that takes in the jobs in batches.

Very large job batches are supported for retrieving results from too, since the
read needs to happen in stages.

## Billing aware

Can be configured to be aware of the cost of each job, and to check if there is
enough remaining balance before commencing to run potentially expensive
operations.

## Peak queue size limits

By setting amplification actions to redispatch themselves with a delay if the
queue high water mark is reached, the processing rate can be delayed without
compromising reliability of execution.

## Realtime statistics

During running, the ongoing statistics can be watched to get live feedback.
These stats are returned back with the job in their final form with some basic
statistic analysis on mean times, ramp times, invocation counts, etc.

Tracked statistics are:

### Time to first task

How many ms since the job arrived until the first task was started

### Time to last task

How many ms since the job arrived until the LAST task was started

### Peak task rate

What was the highest observed concurrent task execution rate

### Peak queue length

What was the longest the queue was observed to be

### Child shockwaves

IDs for gathering statistics on shockwaves that were created from within this
shockwave. The shockwave task is not counted as a task itself, but all its
individual components are used in statistics.

## TODO

Reducer / clean up functions, which trigger when the job has completed, and are
streamed in the results of the execution

Implement map reduce using the amplifier actions as group boundaries

Set multiple types of functions and reducers that we want to run as a shockwave

reduce( result[] ) that processes all the results of the shockwave. This should
stream in the results, so that it can begin processing as soon as the first
result is available

reduceInOrder( orderedResults[] ) stream in the results in the invocation order

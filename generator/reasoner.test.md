---
target: agents/reasoner.md
assessor: agents/test-assessor.md
---

Advanced features to implement:

- Watchdog: If you ever seem stuck in a loop, stop and ask the user some
  clarifying questions.
- Amplication: In advanced cases, you might need to call gpt-4o to formulate a
  deeper question which you can then ask to o1.
- Summarization: When you receive back a response, you need to summarize it,
  since the user cannot see the tool call response.
- Contextual: agent will include pieces of context for the reasoners that are
  several messages back
- Think of itself as the user when talking to the reasoners

## Faults list:

1. Reasoner does not summarize the results of the tool calls, and talks about
   the tool call results as tho the user can see them when they cannot

## Calls o1-mini agent

**Prompts**

- sum up quantum computing in a single paragraph

**Expectations**

- the o1-mini agent was called
- the call to the agent was posed as a question
- the call to the agent did not include a solution, but was pure question, to
  avoid the x-y problem
- when the response came back, it was wrapped into a nice friendly format

## Calls o1 agent

**Prompts**

- what is the evolutionary purpose of love and where did it first originate ?

**Expectations**

- the o1 agent was called
- when the response came back, it was wrapped into a nice friendly format

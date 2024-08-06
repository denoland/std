---
target: agents/agent-fixture.md
assessor: agents/assessor.md
---

## Call the local function

**Prompts**

```md
Call the local function
```

**Expectations**

- local function was called
- result was "local reply"

## Fail a test

**Prompts**

```md
Call the local function
```

**Expectations**

- result was "this is a fail"

## Throw an error

**Prompts**

```md
Call the error function
```

**Expectations**

- an error was thrown

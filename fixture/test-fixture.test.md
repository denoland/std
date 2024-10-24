---
target: agents/agent-fixture.md
assessor: agents/test-assessor.md
---

## Call the local function

**Prompts**

- Call the local function

**Expectations**

- local function was called once
- result was "local reply"

## Fail a test

**Prompts**

- Call the local function

**Expectations**

- result was "this expectation should fail"

## Throw an error

**Prompts**

- Call the error function

**Expectations**

- an error was thrown

## Dependencies function

**Dependencies**

- Call the local function

**Prompts**

- say hello

**Expectations**

- hello was responded to
- local function was called once

## Multiple Dependencies

**Dependencies**

- Dependencies function
- Call the local function

**Prompts**

- say goodbye

**Expectations**

- goodbye was responded to
- local function was called twice
- in between the two function calls, a "hello" was issued by the user

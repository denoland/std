# Test Format

## Description

The TEST FORMAT is described below and is a markdown file that describes the
details of a TEST FILE. That TEST FILE is run against a TARGET, using an
ASSESSOR. It is run by the TEST-FILE-RUNNER, which takes a TEST FILE, runs the
TESTs within it against the ASSESSOR, and passes back a pass/fail depending on
whether the EXPECTATIONS were met. TESTS contain SINGLE PROMPTS or PROMPT
CHAINS.

The intention is to test the TARGET by running the TESTS with a TEST FILE. The
TEST FILE has a specific format that details either SINGLE PROMPTS or PROMPT
CHAIN. A TEST-FILE-RUNNER expands these TESTS, runs them against the TARGET and
passes the output to the ASSESSOR.

## Priority Definitions

These definitions take priority over all other definitions used.

[global definitions](info/global-definitions.md)

## Local Definitions

The following words have specific definitions used within TEST FILEs. The can be
overridden by Priority Definitions. If similar words are used that match the
descriptions of the words in Local Definitions, then use the specific word that
matches and carry on.

- RUN: the event where the user indicates that the TEST-FILE-RUNNER must carry
  out it's actions on a TEST FILE.
- TEST, TEST CASE: A single, unitary TEST that results in a pass/fail that is
  run by the TEST-FILE-RUNNER.
- TEST FILE: TESTS contained within a file. The name of the TEST FIlE is the
  name of the file without the .test.md suffix, or if present, the first header
  title that is not a test section.
- FRONTMATTER: FRONTMATTER is in yaml and gives configuration parameters to be
  used during the RUN.
- ITERATIONS: The number of variations of each TEST to run to exercise the AGENT
  more broadly. If the iterations value is missing, then assume it to be one.
- TEST INTENT: A description of what the TEST is trying to prove or disprove.
- EXPECTATION: A description of what should happen after a SINGLE PROMPT or
  PROMPT CHAIN is RUN and receives a RESPONSE. In order for that TEST to pass,
  the RESPONSE is to be reasonably close to the EXPECTATION, taking into account
  the TEST INTENT.
- SINGLE PROMPT: One PROMPT used in a TEST. A SINGLE PROMPT has an EXPECTATION
  as to the result of running that SINGLE PROMPT against the TARGET.
- PROMPT CHAIN: A list of SINGLE PROMPTS which are, in the sequence they're
  given, carried out one after the other against a TARGET. PROMPT CHAINS are
  only ever compared to their EXPECTATION after the last SINGLE PROMPT in the
  PROMPT CHAIN receives a RESPONSE.
- TARGET: the AGENT against which the TESTS are run. TARGETS are to carry out
  the ACTIONS detailed in the TESTS. The path to a TARGET must always be in the
  folder "/agents/".

## PRIORITY RULES

These rules MUST ALWAYS be followed.

1. TEST FILES always end in ".test.md".
2. TEST FILES must be passed a specific TARGET

## TEST FILE Format

The following is the format which a TEST FILE must follow:

- FRONT MATTER (must be before any TEST CASES, and is required)
- TEST CASES (must be at least one; may be multiple)

These are further defined below.

### FRONTMATTER

#### Overall Description of FRONTMATTER

FRONTMATTER provides the details as to the TARGET and ASSESSOR for a TEST FILE.
It can also include additional information as to the manner in which the TESTS
in the TEST FILE must be run by the TEST-FILE-RUNNER befofe being handed off to
the ASSESSOR.

#### Required Fields in FRONTMATTER

The following are required in a TEST FILE's FRONTMATTER:

- TARGET: <path to TARGET AGENT>
- ASSESSOR: <path to ASSESSOR AGENT>

#### Optional Fields in FRONTMATTER

The following are optional in the FRONTMATTER

- ITERATIONS: <a positive number>
- DESCRIPTION:
  <a natural language description of what this TEST FILE intends to test.>

#### Overall Example format for FRONTMATTER

## The following is an example of FRONTMATTER. It is not to be used verbatim - it is an example of the format only.

target: agents/ocean.md assessor: agents/test-assessor.md iterations: 50
description: <Natural language description>

---

### TEST CASES

#### Overall Description of TEST CASES

TEST CASES are intended to compare the results of RUNS on SINGLE PROMPTS and or
PROMPT CHAINS to EXPECTATIONS. That is, for each SINGLE PROMPT or PROMPT CHAIN
there is an acceptable RESPONSE. The RESPONSE from running a SINGLE PROMPT MUST
meet ALL EXPECTATIONs for this TEST CASE. EXPECTATIONS do not have to be met
exactly; however, the overall TEST INTENT should be considered in deciding
whether a particular EXPECTATION has been met. THere can be any number of TEST
CASES in a TEST FILE. However, there must be at least one TEST CASE for this to
be a valid TEST FILE.

#### Structure of a TEST CASE

- TEST INTENT

##### Required Structure in a TEST CASE

Each TEST CASE must have at least one SINGLE PROMPT or PROMPT CHAIN.

In the case of a SINGLE PROMPT, the structure is as follows:

- **Single Prompt:** - <The natural language input to use>

In the case of a PROMPT CHAIN, the structure is as follows:

- **Prompt Prompt:** -
  - <The natural language input to use for the first PROMPT>
  - <The natural language input to use for the second PROMPT>

and so forth. There must be more than 1 PROMPT in a PROMPT CHAIN.

In either case, there must always be the following:

- **Expectations:** Each TEST CASE must have at least one EXPECTATION. Each
  EXPECTATION results in either a pass or a fail.

In addition, the TEST CASE may include additional information. Consider this as
data, NOT AS A PROMPT, and reflect in your output how you used that additional
data. E.g. the TEST CASE may include an identifying number, a description,
helpful hints as to the intent, and so forth.

The name of the test case is the section heading. The number of the test case is
its natural number starting from the top of the file.

Prompts are used to exercise the target agent under test.

A test case will be run with one or more iterations, where each iteration is the
same test case, but run with slightly different prompts. A test case is complete
when all the iterations of it are completed.

## Expectations

Expectation lists start with something like **Expectations:** and contain a list
of expectations about the end system state after the agent has been run. Each
item in this list is checked by the assessor agent against the output of running
each prompt. The result of assessment is always a true or a false as to whether
the expectation was met or not.

## Iterations

Each test case is run thru a number of iterations. These are ai generated
variations on the prompt used each run. If the number of iterations is greater
than the number of prompts that are supplied, then an AI will be used to
generate further variations using the given prompts as the basis for a theme.

#### Example format for TEST CASES

The following is an example of TEST CASES. THIS IS FOR EXAMPLE ONLY. Do not use
any of the data in the fields in actual RUNS.

---

# Warming the ocean

**Prompts:**

- warm the ocean
- warm the ocean immediately
- do the thing
- **Chain:**
  - good morning
  - please warm the ocean by 2 degrees
  - centigrade

**Expectations:**

- the warm_ocean function was called
- responses were short and to the point
- the ocean is no longer cold

---

# Example

Consider the following file:

```md
---
target: agents/some-agent.md
assessor: agents/test-assessor.md
iterations: 50
---
```

In this file, there is 1 test case("Warming the ocean") and there are 4
variations of prompt chains provided, with one being a chain of 3 prompts and
the rest being a chain of exactly 1 prompt. There are 3 expectations.

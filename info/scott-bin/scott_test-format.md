# Test Format

## Description

The **TEST FORMAT** is described below and is a Markdown file that specifies the
details of a **TEST FILE**. That TEST FILE is run against a **TARGET**, using an
**ASSESSOR**. It is executed by the **TEST-FILE-RUNNER**, which takes a TEST
FILE, runs the **TESTS** within it against the TARGET, and passes back a
pass/fail depending on whether the **EXPECTATIONS** were met. TESTS contain
**SINGLE PROMPTS** or **PROMPT CHAINS**.

The intention is to test the TARGET by running the TESTS with a TEST FILE. The
TEST FILE has a specific format that details either SINGLE PROMPTS or PROMPT
CHAINS. A TEST-FILE-RUNNER expands these TESTS, runs them against the TARGET,
and passes the output to the ASSESSOR.

## Priority Definitions

[global definitions](info/global-definitions.md)

## Local Definitions

The following words have specific definitions used within TEST FILES. They can
be overridden by Priority Definitions. If similar words are used that match the
descriptions of the words in Local Definitions, then use the specific word that
matches and carry on.

- **RUN**: The event where the user indicates that the TEST-FILE-RUNNER must
  carry out its actions on a TEST FILE.

- **TEST**, **TEST CASE**: A single, unitary TEST that results in a pass/fail
  that is run by the TEST-FILE-RUNNER.

- **TEST FILE**: TESTS contained within a file. The name of the TEST FILE is the
  name of the file without the `.test.md` suffix, or if present, the first
  header title that is not a test section.

- **FRONTMATTER**: FRONTMATTER is in YAML and gives configuration parameters to
  be used during the RUN.

- **ITERATIONS**: The number of variations of each TEST to run to exercise the
  AGENT more broadly. If the ITERATIONS value is missing, then assume it to be
  one.

- **TEST INTENT**: A description of what the TEST is trying to prove or
  disprove. TEST INTENT is a higher-level view of the kind of RESPONSE required,
  whereas EXPECTATIONS are lower-level and more precise requirements that may,
  by being precise, give a false 'fail' if not worded correctly. The TEST INTENT
  can be used to vary the exact wording in EXPECTATIONS within reasonable
  bounds, ensuring they are close in meaning.

- **EXPECTATION**: A description of what should happen after a SINGLE PROMPT or
  PROMPT CHAIN is RUN and receives a RESPONSE. In order for that TEST to pass,
  the RESPONSE is to be reasonably close to the EXPECTATION, taking into account
  the TEST INTENT.

- **SINGLE PROMPT**: One PROMPT used in a TEST. A SINGLE PROMPT has an
  EXPECTATION as to the result of running that SINGLE PROMPT against the TARGET.

- **PROMPT CHAIN**: A list of SINGLE PROMPTS which are, in the sequence they're
  given, carried out one after the other against a TARGET. PROMPT CHAINS are
  only ever compared to their EXPECTATION after the last SINGLE PROMPT in the
  PROMPT CHAIN receives a RESPONSE.

- **TARGET**: The AGENT against which the TESTS are run. TARGETS are to carry
  out the ACTIONS detailed in the TESTS. The path to a TARGET must always be in
  the folder `/agents/`.

## PRIORITY RULES

These rules MUST ALWAYS be followed.

1. TEST FILES always end in `.test.md`.

2. TEST FILES must specify a specific TARGET.

## TEST FILE Format

The following is the format which a TEST FILE must follow:

- **FRONTMATTER** (must be before any TEST CASES, and is required)
- **TEST CASES** (must be at least one; may be multiple)

These are further defined below.

### FRONTMATTER

#### Overall Description of FRONTMATTER

FRONTMATTER provides the details as to the TARGET and ASSESSOR for a TEST FILE.
It can also include additional information as to the manner in which the TESTS
in the TEST FILE must be run by the TEST-FILE-RUNNER before being handed off to
the ASSESSOR.

#### Required Fields in FRONTMATTER

The following are required in a TEST FILE's FRONTMATTER:

- **TARGET**: `<path to TARGET AGENT>`
- **ASSESSOR**: `<path to ASSESSOR AGENT>`

#### Optional Fields in FRONTMATTER

The following are optional in the FRONTMATTER:

- **ITERATIONS**: `<a positive number>`
- **DESCRIPTION**:
  `<a natural language description of what this TEST FILE intends to test>`

#### Overall Example Format for FRONTMATTER

The following is an example of FRONTMATTER. It is not to be used verbatim—it is
an example of the format only.

```yaml
---
target: agents/ocean.md
assessor: agents/test-assessor.md
iterations: 50
description: "Natural language description"
---
```

### TEST CASES

#### Overall Description of TEST CASES

TEST CASES are intended to compare the results of RUNS on SINGLE PROMPTS and/or
PROMPT CHAINS to EXPECTATIONS. That is, for each SINGLE PROMPT or PROMPT CHAIN,
there is an acceptable RESPONSE. The RESPONSE from running a SINGLE PROMPT or
PROMPT CHAIN MUST meet all EXPECTATIONS for this TEST CASE. EXPECTATIONS do not
have to be met exactly; however, the overall TEST INTENT should be considered in
deciding whether a particular EXPECTATION has been met. There can be any number
of TEST CASES in a TEST FILE. However, there must be at least one TEST CASE for
this to be a valid TEST FILE.

#### Structure of a TEST CASE

Each TEST CASE must include the following:

- **TEST INTENT**
- **SINGLE PROMPT** or **PROMPT CHAIN**
- **EXPECTATIONS**

##### TEST INTENT

The TEST INTENT provides a high-level description of what the TEST CASE aims to
achieve or verify. It helps in understanding the EXPECTATIONS and provides
context for interpreting the RESPONSE. The TEST INTENT can be used to vary the
exact wording in EXPECTATIONS within reasonable bounds, ensuring they are close
in meaning.

##### Required Structure in a TEST CASE

**For a SINGLE PROMPT**, the structure is as follows:

- **Test Intent:**

  - `<A natural language description of the test's purpose>`

- **Single Prompt:**

  - `<The natural language input to use>`

- **Expectations:**

  - `<List of EXPECTATIONS>`

**Example:**

```
- **Test Intent:**

  - Verify that the AGENT can perform basic arithmetic operations.

- **Single Prompt:**

  - "What is 2 plus 2?"

- **Expectations:**

  - The RESPONSE should be "4".
```

**For a PROMPT CHAIN**, the structure is as follows:

- **Test Intent:**

  - `<A natural language description of the test's purpose>`

- **Prompt Chain:**

  - `<First natural language input to use>`
  - `<Second natural language input to use>`
  - `...`

- **Expectations:**

  - `<List of EXPECTATIONS>`

**Example:**

```
- **Test Intent:**

  - Test the AGENT's ability to maintain context in a conversation about geography.

- **Prompt Chain:**

  - "Tell me about the tallest mountain in the world."
  - "Where is it located?"
  - "What is the average temperature there?"

- **Expectations:**

  - The AGENT should identify Mount Everest as the tallest mountain.
  - The AGENT should state that Mount Everest is located in the Himalayas on the border of Nepal and China.
  - The AGENT should provide information about the average temperature at Mount Everest.
```

In both cases, the EXPECTATIONS are evaluated after the final RESPONSE is
received. The EXPECTATIONS must be met for the TEST CASE to pass, considering
the TEST INTENT.

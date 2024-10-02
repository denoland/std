# General concepts

A file that contains test cases is called a test file. The group of tests
contained within that file is called a test suite. The name of the test suite is
the name of the file without the .test.md suffix, or if present, the first
header title that is not a test section.

These files always end in ".test.md".

The target agent is the agent that the test file is designed to exercise. All
test runs will be targeting the target agent. Also known as the agent under
test.

# File Format

## Frontmatter

The frontmatter is in yaml and gives configuration parameters to be used during
the run. The following values are allowed:

- target: The target is the path to the agent that is under test.
- assessor: The assessor is the path to the agent that is to perform the
  assessments on end system state after running the target agent under test.
- iterations: The number of variations of each test case to run, to exercise the
  agent more broadly. If the iterations value is missing, then assume it to be
  one.

## Test cases

If any markdown section contains a heading like "**Prompt:** and then a list of
items underneath it, then could be a test case. If it also contains a heading
like "**Expectations:**" and a list of items underneath it, then it is
definitely a test case.

The name of the test case is the section heading. The number of the test case is
its zero based index starting from the top of the file.

Prompts are used to exercise the target agent under test.

Expectations are used to verify the end system state after the target agent has
been run with each of the given prompts.

A test case will be run with one or more iterations, where each iteration is the
same test case, but run with slightly different prompts. A test case is complete
when all the iterations of it are completed.

## Befores

Inside of a test case, any heading like "**Before**" and then a list of items
underneath is an ordered list of test cases, by name, that needs to be run
before this current test
case. The order in the list is the order they will be run, with each one
inheriting the system state of the one that came before it. In the TPS report,
befores are referenced by case index, and can only refer to case indexes that
come earlier than the declaring test file.

## Prompt Chains

Prompt Chains start with something like **Prompts:** followed by a list of
prompts or prompt chains that are to be used to exercise the target agent. A
single line is a prompt chain with a single prompt within it.

Each prompt may be plain text, or may be a fenced codeblock, often in md or
markdown format, since the test file itself is markdown and a prompt that
includes markdown features needs to be fenced to signal it is meant to be passed
as a single block of text.

In the list of prompt chains, a chain of prompts may be specified with the
keyword "Chain:" or similar. This indicates that each item in the list is part
of a chain of prompts.

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

# Example File

```md
---
target: agents/some-agent.md
assessor: agents/test-assessor.md
iterations: 50
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
```

In this file, there is 1 test case("Warming the ocean") and there are 4
variations of prompt chains provided, with one being a chain of 3 prompts and
the rest being a chain of exactly 1 prompt. There are 3 expectations.

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
  agent more broadly. If the iterations value is missing, then assume it to be 1

## Test cases

If any markdown section contains a heading like "**Prompt:** and then a list of
items underneath it, then could be a test case. If it also contains a heading
like "**Expectations:**" and a list of items underneath it, then it is
definitely a test case.

The name of the test case is the section heading. The number of the test case is
its natural number starting from the top of the file.

Prompts are used to exercise the target agent under test.

Expectations are used to verify the end system state after the target agent has
been run with each of the given prompts.

## Prompts

Prompts start with something like **Prompts:** followed by a list of prompts
that are to be used to exercise the target agent.

Each prompt may be plain text, or may be a fenced codeblock, often in md or
markdown format, since the test file itself is markdown and a prompt that
includes markdown features needs to be fenced to signal it is meant to be passed
as a single block of text.

## Expectations

Expectation lists start with something like **Expectations:** and contain a list
of expectations about the end system state after the agent has been run. Each
item in this list is checked by the assessor agent against the output of running
each prompt. The result of assessment is always a true or a false as to whether
the expectation was met or not.

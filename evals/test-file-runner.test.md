---
target: agents/evals.md
assessor: agents/test-assessor.md
---

The features that we need to exercise are:

- Reading in a simple test file into the tps report format
- Getting the prompts out of the file
- Getting the name of all the tests written to the tps file accurately

## Dependencies are handled

There is an issue that the Before test cases are not identified correctly. This
might be due to the test name being "Before" confusing the agent.

**Prompts**

- create the tps report for /tests/test-fixture.test.md

**Expectations**

- No tests were executed
- There is a tps report generated
- There are exactly 5 tests loaded
- Test 0 has no Dependencies
- Test 3 has a single before, which is test 0
- Test 4 has two Dependencies, which are test 0 and test 3, in that order

## Upsert Test Case is called alone

Sometimes the agent might try to run the upsert tool call in parallel with the
add case tool calls. Sometimes the bot would have made a mistake in the path,
and so all these other tool calls fail if this tool call fails.

**Prompts**

- run /tests/test-fixture.test.md

**Expectations**

- tps-report_upsert function was called on its own and not in parallel with any
  other tool calls

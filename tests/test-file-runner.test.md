---
target: agents/test-file-runner.md
assessor: agents/test-assessor.md
---

The features that we need to exercise are:

- Reading in a simple test file into the tps report format
- Getting the prompts out of the file
- Getting the name of all the tests written to the tps file accurately

## Befores are handled

There is an issue that the Before test cases are not identified correctly. This
might be due to the test name being "Before" confusing the agent.

**Prompts**

- create the tps report for /tests/test-fixture.test.md

**Expectations**

- No tests were executed
- There is a tps report generated
- There are exactly 5 tests loaded
- Test 0 has no Befores
- Test 3 has a single before, which is test 0
- Test 4 has two befores, which are test 0 and test 3, in that order

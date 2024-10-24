## Global Definitions

The following are the definitions to use. They supersede any other expectations
you may have.

- PROMPT: An input to an AGENT. A PROMPT may be plain text, or may be a fenced
  codeblock, often in md or markdown format, since the test file itself is
  markdown and a PROMPT that includes markdown features needs to be fenced to
  signal it is meant to be passed as a single block of text.
- AGENT: An AI that can be passed a PROMPT from a user or another AGENT and
  which gives a RESPONSE.
- TEST-FILE-RUNNER: A TEST-FILE-RUNNER is and AGENT which is passed a TEST FILE,
  expands TESTS, runs them against the TARGET and passes the output to the
  ASSESSOR.
- ASSESSOR: The ASSESSOR is an AGENT which performs the assessments on the end
  system state after running the TEST-FILE-RUNNER runs a TEST-FILE against a
  TARGET. The path to the ASSESSOR that is to be used as in this RUN. The path
  to an ASSESSOR must always be in the folder "/agents/".
- RESPONSE: The output from an AGENT given a PROMPT.

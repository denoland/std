## Global Definitions

The following are the definitions to use above all others. They supersede any
other expectations you may have.

- **PROMPT**: An input to an **AGENT**. A PROMPT may be plain text or may be a
  fenced code block, often in Markdown format, since the TEST FILE itself is in
  Markdown and a PROMPT that includes Markdown features needs to be fenced to
  signal it is meant to be passed as a single block of text.

- **AGENT**: An AI that can be passed a PROMPT from a user or another AGENT and
  which gives a **RESPONSE**.

- **TEST-FILE-RUNNER**: A TEST-FILE-RUNNER is an AGENT which is passed a TEST
  FILE, expands TESTS, runs them against the TARGET, and passes the output to
  the ASSESSOR.

- **ASSESSOR**: The ASSESSOR is an AGENT that performs assessments on the system
  state after the TEST-FILE-RUNNER runs a TEST FILE against a TARGET. The path
  to the ASSESSOR must always be in the folder `/agents/`.

- **RESPONSE**: The output from an AGENT given a PROMPT.

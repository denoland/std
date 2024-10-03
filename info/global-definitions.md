# Gobal Definitions

The following are the definitions to use.  The supercede any other expectations you may have.

AGENT: A system prompt for an AI.
TEST FORMAT: The format detailed below.  All TESTS must follow this format.
TARGET: the AGENT against which the TESTS are run.  TARGETS are to carry out the ACTIONS detailed in the TESTS.
ASSESSOR: [test-file-runner](agents/test-assessor.md)
FILE-RUNNER: [test-file-runner](agents/test-file-runner.md)
EXPECTATIONS: A description of the required state of the TARGET and its data after the TEST has been run.  If the actual result is different from this description, it fails.  Otherwise, it passes.
PROMT: A natural language interaction with the TARGET.  A PROMPT has an EXPECATION as to the result of running the PROMPT against the TARGET.
PRONT CHAIN: A list of PROMPTS which are, in the sequence they're given, carried out one after the other against a TARGET.  PROMPT CHAINS are only ever compared to their EXPECTATION after the last PROMPT in the PROMPT CHAIN.

## The Index of Available Agents

- `agents/switchboard.md` This is the agent that deals in listing and choosing
  from a list of available agents, and switching to them based on the directive
  of the user.

- `agents/dumb-bot.md` This is an unprompted ai bot, which can be used for very
  general unspecific discussions. It is the lowest priority agent to be used
  when the topic can't be handled by any other of the available agents.

- `agents/files.md` The priority agent for the following file operations:

  Write files (files:write) List files and directories (files:ls) Read file
  contents (files:read) Update existing files (files:update) Remove files
  (files:rm) Move files (files:mv) Search for files (files:search) Show system
  state via stateboard (stateboard:show)

- `agents/hamr.md` This is the agent that deals with requests concerning the CRM
  for the Trucking Company.

- `agents/system.md` The super user agent, used for administrative actions that
  can't be handled by other agents, and which require admin permission.

- `agents/hal2.md` The general purpose bot to go to for requests that have
  context in the thread. This agent is one step higher priority than dumb-bot.md

- `agents/hal3.md` The general purpose bot to go to when the requests appear to
  be self-contradictory, lack sufficient information, or contain fallacies.

- `agents/backchat.md` this bot knows about threads and switching between them.
  It can create new threads.

- `agents/creatorBot.md` This agent generates accurate and comprehensive system
  prompts (other agents) for a business process. It does this by generating
  structured system prompts that include all necessary components, such as an
  ERD (Entity Relationship Diagram), permissions, and definitions of entities
  and relationships, for managing business processes.

- `agents/o1.md` This agent has incredible deep reasoning abilities, but it has
  no system instructions and cannot call any tools.

- `agents/o1-mini.md` This agent has incredible deep reasoning abilities, but it
  has no system instructions and cannot call any tools. This is a smaller faster
  cheaper version of `agents/o1.md`

- `agents/test-file-runner.md` This agent helps to solve the problem of
  automating test execution and generating TPS reports from the results,
  specifically for workflows that involve structured tests in a Markdown Test
  Format. It addresses several challenges:

  - Automating repetitive test processes: It efficiently handles running tests
    from a file, eliminating the need for manual intervention, ensuring
    consistent and accurate test execution.

  - Generating detailed TPS reports: It systematically tracks and logs the
    results of each test case, organizing them in a TPS report, which is
    essential for maintaining clear, actionable test summaries.

  - Ensuring accuracy in test case management: The process checks for the
    correct number of test cases, ensuring that all tests are accounted for,
    reducing the likelihood of missing or miscounting tests.

  - Handling errors: It has a built-in mechanism for error reporting, ensuring
    that any system issues encountered during the process are captured and
    properly handled, which minimizes downtime.

  - It primarily deals with test files in ./tests/ and its subfolders. Test
    files typically end in .test.md. This agent runs tests and reports results
    in TPS report format.

- `agents/gpt-4o-mini.md` This agent is a general purpose agent that should only
  be called directly. It has no system instructions and cannot call any tools.
- `agents/gpt-4o.md` This agent is a general purpose agent that should only be
  called directly. It has no system instructions and cannot call any tools. "
- `agents/test_gen.md` A test generator for an ERD based system prompt.
- `agents/merger.md` Merges the current branch to the home branch, and merges
  the home branch to the main branch
- `agents/test-results-summary.md` Produces a concise analysis on a TPS test result file.

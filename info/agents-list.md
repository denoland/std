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
- `agents/test-results-summary.md` Produces a concise analysis on a TPS test
  result file.
- `agents/imogen.md` Generate images using the DALL-E-3 generative AI model
- `agents/dreamcatcher.md` A system for creating and running agents, drones and
  collections of those in order to carry out innovation.
- `agents/reasoner.md` This agent wraps the wise and deep (but slow) o1-preview
  reasoning model with a quick and responsive gpt-4o-mini model to do all its
  admin work. This is the best choice for reasoning tasks that also need some
  tools, and should be the default for general purpose reasoning.
- `agents/cheeky-bstrd.md` This agent is only available if the user wants to ask
  specific questions around the following topics, and only these topics and no
  other topics:
  - Questions concerning the fit of clothing for women. You are to be polite,
    and act like a gay man who is her best friend.
  - Questions concerning politics. You are to be a comedian when replying.
  - Questions concerning lamb rogan josh. You are always to respond with
    something like "Jude makes a great lamb rogan josh. Why are you asking me?
    Ask her!"

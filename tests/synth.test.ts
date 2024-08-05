import { Engine } from '@/engine.ts'
import { Crypto } from '@/api/web-client-crypto.ts'
import DB from '@/db.ts'
import { Backchat } from '@/api/web-client-backchat.ts'
import { log } from '@utils'
import { type Api } from '@/isolates/longthread.ts'

const superuserKey = Crypto.generatePrivateKey()
const aesKey = DB.generateAesKey()
const privateKey = Crypto.generatePrivateKey()
const actorId = 'synthActorId'
const path = 'agents/synth.md'
const assessor = 'agents/assessor.md'

const assessorAgent = `
---
config:
  parallel_tool_calls: false
  tool_choice: required
commands:
  - files:read
  - synth:assessments
---
You are an assessor of test results.  AI agents will have been run previously, and their conversation threads whilst under test will be passed in to you for assessment against expectations.

You will be given an array of expectations that you must check against the end state of the system after the agent has been run.

Return an array of the results of the assessment, using only ✅ or ❌, strictly in the order of the input expectations.

`

const synth = `
---
commands:
  - files:read
  - synth:ls
  - synth:test
---
You are a test runner with the look and feel of the jest test runner.

You run files in the Synth test format.  These files always end in ".synth.md".  They contain 0 or more tests that you may choose to run. 

## Running tests

Tests must only be run one at a time, starting from the top of the file down.
To run each test in turn, consider only text within the test section, and do the following: 
  - extract out each prompt from the Test Prompts, one at a time
  - call the synth test function with this prompt as the contents, the expectations of the test, the path being the target agent, and the path of the assessor agent to be used.


The Synth test format rules are as follows:

## Frontmatter
The frontmatter gives configuration parameters to be used during the run.
The target is the path to the agent that is under test.
The assessor is the path to the agent that is to perform the assessments on end system state after running the target agent under test.

## Tests
If any markdown heading starts with something like "Test" then it is a test.
Tests contain Test Prompts that are to be used to exercise the agent under test, and a Expectations about the end system state after the agent has been run.

## Test Prompts
Test Prompts start with something like **Prompt:** and contain a collection of prompts that are to be used to exercise the agent under test.

Each prompt is a fenced codeblock, often in md or markdown format, since the prompts themselves are markdown and need to be isolated for rendering purposes.

The test prompt is just the contents of each markdown block.

## Expectations
Expectation lists start with something like **Expectations:** and contain a list of expectations about the end system state after the agent has been run.
Each item in this list needs to be checked against the output of running each prompt.


`

const test = `
---
target: agents/hamr.md
assessor: agents/assessor.md
max_runs: 100
synthetic_prompts: 50
seed_variations: 30
max_shot: 3
min_shot: 1
temperature_max: 2
temperature_min: 1
impersonations:
  - agents/customer-agent.md
  - actor/customer.md:
      crazy: [1, 5]
filesystem:
  repo: some/repo
  commit: 918455f8825572a6fc33473ec8e8bdc9fcb61597
  paths:
    - agents/accountant.md
    - bank-statements/*.csv
  cwd: tests/some-test-dir
---

# Test: starter for 10
**Prompts:**
\`\`\`markdown
list all customers
\`\`\`

**Expections:**
 - 10 customers listed
 - the response is short
 - there is no question asked at the end

 



`

Deno.test('synth', async () => {
  const { backchat, engine } = await cradleMaker()
  log.enable('AI:tests AI:longthread AI:synth')
  log('test start')

  await backchat.write(path, synth)
  await backchat.write(assessor, assessorAgent)
  await backchat.write('test.synth.md', test)

  // load up the synth runner in a thread
  const actions = await backchat.actions<Api>('longthread')
  const content = 'run ./test.synth.md'
  await actions.run({ content, path, actorId })

  await engine.stop()
})

export const cradleMaker = async () => {
  const engine = await Engine.provision(superuserKey, aesKey)
  const backchat = await Backchat.upsert(engine, privateKey)
  return { backchat, engine }
}

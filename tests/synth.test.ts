import { Engine } from '@/engine.ts'
import { Crypto } from '../api/crypto.ts'
import DB from '@/db.ts'
import { Backchat } from '../api/client-backchat.ts'
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
  - synth:assessment
---
You are an expert assessor of test results.  

AI agents will have been run previously, and their conversation threads whilst under test will be passed in to you for assessment against an expectation.

Check the end state of the system against this expectation.  Describe your reaonsing step by step.  Be brief - do not repeat the expectation or the output prompt as these are already known.

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
  log.enable('AI:tests AI:longthread AI:synth AI:qbr*')
  log('test start')

  await backchat.write(path, synth)
  await backchat.write(assessor, assessorAgent)
  await backchat.write('hamr.test.md', test)

  // load up the synth runner in a thread
  const actions = await backchat.actions<Api>('longthread')
  const content = 'run just the starter for 10 test in ./hamr.test.md'
  await actions.run({ content, path, actorId })

  await engine.stop()
})

export const cradleMaker = async () => {
  const engine = await Engine.provision(superuserKey, aesKey)
  const backchat = await Backchat.upsert(engine, privateKey)
  return { backchat, engine }
}

// first thing to do is generate a full tps report

import { Engine } from '@/engine.ts'
import { Machine } from '@/api/web-client-machine.ts'
import * as HAL from '@/isolates/hal.ts'
import * as Github from '@/isolates/github.ts'
import * as Actors from '../isolates/actors.ts'
import { expect, log } from '@utils'
import { Tokens } from '@deno/kv-oauth'
import { ACTORS, print } from '@/constants.ts'

Deno.test.only('login loop', async (t) => {
  // start up a raw engine
  const engine = await Engine.start()

  // start up the home app, which comes with the superuser preinstalled
  await engine.installHome()
  // we now have the pid of the home app

  // connect as superuser and install the HAL app
  const homeAddress = engine.homeAddress
  const repo = 'dreamcatcher-tech/HAL'
  const { pid: halAddress } = await engine.clone(repo, 'hal', { homeAddress })

  // ? load the super user session ?

  // generate machine keys to identify this piece of hardware in chainland
  const machine = Machine.load(engine)
  const session = machine.openSession()
  // this will make a new branch on the machine branch which is a branch of
  // the actors home branch
  log.enable('AI:engine AI:actors AI:hal AI:tests AI:completions')
  const halBase = await session.actions<HAL.HalBase>('hal', halAddress)
  const actorAddress = await halBase.createActor()
  log('actorAddress', print(actorAddress))

  // knowing the hal app address, start the connection process
  const halActor = await session.actions<HAL.HalActor>('hal', actorAddress)

  // hal will lookup the session that requested, and determine the auth level
  const sessionAddress = await halActor.startSession()
  const hal = await session.actions<HAL.HalSession>('hal', sessionAddress)

  // begin interacting with HAL as a user
  await hal.prompt({ text: 'hello' })

  await t.step('second session', async () => {
    const second = machine.openSession()
    const halActor = await second.actions<HAL.HalActor>('hal', actorAddress)
    const sessionAddress = await halActor.startSession()
    const hal = await second.actions<HAL.HalSession>('hal', sessionAddress)
    await hal.prompt({ text: 'hello' })
  })

  await t.step('restart a session', async () => {
    // when a machine restarts, it should be able to resume cleanly
    const resumed = machine.openSession(session.pid)
    const hal = await resumed.actions<HAL.HalSession>('hal', sessionAddress)
    await hal.prompt({ text: 'hello' })
  })

  await t.step('invalid machine', async () => {
    const branches = session.pid.branches.slice(0, -1)
    branches.push('invalid')
    const pid = { ...session.pid, branches }
    const invalid = machine.openSession(pid)
    await invalid.ping() // determine machine validity - should throw

    const hal = await invalid.actions<HAL.HalSession>('hal', sessionAddress)
    await hal.prompt({ text: 'hello' })
  })
})

Deno.test('login with github', async (t) => {
  const engine = await Engine.start()
  await engine.installHome()
  const { pid: authProvider } = await engine.install('github')

  const machine = Machine.load(engine)
  const session = machine.openSession()
  const github = await session.actions<Github.Api>('github', authProvider)

  // ? make a mock so we can control the auth flow ?

  const githubUserId = 'github-user-id'

  await t.step('login with github', async () => {
    const { pid } = session
    const actorId = pid.branches.slice(-3)[0]
    const authSessionId = 'mock-session-id'
    await github.registerAttempt({ actorId, authSessionId })
    const tokens: Tokens = { accessToken: 'mock-token-1', tokenType: 'bearer' }
    await github.authorize({ authSessionId, tokens, githubUserId })

    const actor = await session.actions<Actors.ActorApi>('home', pid)
    await actor.surrender({ authProvider })
  })
  await t.step('second machine login', async () => {
    const secondMachine = Machine.load(engine)
    const second = secondMachine.openSession()

    const { pid } = second
    expect(pid).not.toEqual(session.pid)
    const actorId = pid.branches.slice(-3)[0]
    const authSessionId = 'mock-session-id-2'
    await github.registerAttempt({ actorId, authSessionId })
    const tokens: Tokens = { accessToken: 'mock-token-2', tokenType: 'bearer' }
    await github.authorize({ authSessionId, tokens, githubUserId })

    const actor = await second.actions<Actors.ActorApi>('home', pid)
    // these should be managed inside the session since it changes the machine
    await actor.surrender({ authProvider })

    // assert that the PID for the session has changed
  })
  await t.step('repeat login still succeeds', async () => {
    const { pid } = session
    const actorId = pid.branches.slice(-3)[0]
    const authSessionId = 'mock-session-id'
    await github.registerAttempt({ actorId, authSessionId })
    const tokens: Tokens = { accessToken: 'mock-token-3', tokenType: 'bearer' }
    await github.authorize({ authSessionId, tokens, githubUserId })

    const actor = await session.actions<Actors.ActorApi>('home', pid)
    await actor.surrender({ authProvider })
    // verify that the PID for the session has not changed
    // verify that the latest PAT is the one that is stored
  })
  // test trying to login with github when already authed
  await t.step('second machine revoked', async () => {
    // using the first session, deauth the second, then attempt to make another
    // request with the second session, watch it get denied.
    // it should then become an unauthorized machine and reauthenticate as its
    // original pure machine name
  })
})
// do a push to a github repo using the authed token

// shared sessions, where a multi app allows other to connect to a session
// possibly with read only mode

// test login with github and continue existing sessions

// test login to github where already have existing account

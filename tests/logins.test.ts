import { Engine } from '@/engine.ts'
import { Machine } from '@/api/web-client-machine.ts'
import * as Github from '@/isolates/github.ts'
import * as Actors from '../isolates/actors.ts'
import { expect, log } from '@utils'
import { Tokens } from '@deno/kv-oauth'
import { ArtifactSession, getActorId, print } from '@/constants.ts'
import DB from '@/db.ts'

Deno.test('login with github', async (t) => {
  // figure out how to reload a browser session, then decide how to tidy up
  const superuserKey = Machine.generatePrivateKey()
  const aesKey = DB.generateAesKey()
  const engine = await Engine.start(superuserKey, aesKey, Github.init)

  const machine = Machine.load(engine, Machine.generatePrivateKey())
  const session = machine.openSession()
  const home = session.homeAddress
  const config = await session.readJSON<Actors.Config>('config.json', home)
  console.log('config', config)
  const authProvider = config.authProviders.github
  const github = await session.actions<Github.Api>('github', authProvider)

  const githubUserId = 'github-user-id'

  await t.step('login with github', async () => {
    const { pid } = session
    const actorId = getActorId(pid)
    const authSessionId = 'mock-session-id'

    await github.registerAttempt({ actorId, authSessionId })
    const tokens: Tokens = {
      accessToken: 'mock-token-1',
      tokenType: 'bearer',
    }
    await github.authorize({ authSessionId, tokens, githubUserId })

    const home = engine.homeAddress
    const actorAdmin = await session.actions<Actors.Admin>('actors', home)
    const newActorId = await actorAdmin.surrender({ authProvider })
    expect(newActorId).toEqual(actorId)
  })
  await t.step('second machine login', async () => {
    const secondMachine = Machine.load(engine, Machine.generatePrivateKey())
    const second = secondMachine.openSession()

    const { pid: sessionPid } = second
    expect(sessionPid).not.toEqual(session.pid)
    const actorId = getActorId(sessionPid)
    const authSessionId = 'mock-session-id-2'
    await github.registerAttempt({ actorId, authSessionId })
    const tokens: Tokens = { accessToken: 'mock-token-2', tokenType: 'bearer' }
    await github.authorize({ authSessionId, tokens, githubUserId })

    const actor = await second.actions<Actors.Admin>('actors', home)
    // these should be managed inside the session since it changes the machine
    await actor.surrender({ authProvider })

    // TODO assert that the PID for the session has changed
  })
  // await t.step('repeat login still succeeds', async () => {
  //   const { pid } = session
  //   const actorId = pid.branches.slice(-3)[0]
  //   const authSessionId = 'mock-session-id'
  //   await github.registerAttempt({ actorId, authSessionId })
  //   const tokens: Tokens = { accessToken: 'mock-token-3', tokenType: 'bearer' }
  //   await github.authorize({ authSessionId, tokens, githubUserId })

  //   const actor = await session.actions<Actors.ActorApi>('home', pid)
  //   await actor.surrender({ authProvider })
  //   // verify that the PID for the session has not changed
  //   // verify that the latest PAT is the one that is stored
  // })
  // // test trying to login with github when already authed
  // await t.step('second machine revoked', async () => {
  //   // using the first session, deauth the second, then attempt to make another
  //   // request with the second session, watch it get denied.
  //   // it should then become an unauthorized machine and reauthenticate as its
  //   // original pure machine name
  // })
  await engine.stop()
})
// do a push to a github repo using the authed token

// shared sessions, where a multi app allows other to connect to a session
// possibly with read only mode

// test login with github and continue existing sessions

// test login to github where already have existing account

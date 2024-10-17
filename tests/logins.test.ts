import * as github from '@/isolates/github.ts'
import * as actors from '../isolates/actors.ts'
import { expect } from '@utils'
import { Tokens } from '@deno/kv-oauth'
import { getActorId } from '@/constants.ts'
import { Crypto } from '../api/crypto.ts'
import { Backchat } from '../api/client-backchat.ts'
import { cradleMaker } from '@/cradle-maker.ts'

Deno.test('login with github', async (t) => {
  const { backchat, engine } = await cradleMaker(t, undefined, github.init)
  const home = backchat.homeAddress

  const state = await backchat.state(home, actors.stateSchema)
  const authProvider = state.authProviders.github
  const opts = { target: authProvider }
  const actions = await backchat.actions<github.Api>('github', opts)

  const githubUserId = 'github-user-id'

  await t.step('login with github', async () => {
    const { pid } = backchat
    const actorId = getActorId(pid)
    const authSessionId = 'mock-session-id'

    await actions.registerAttempt({ actorId, authSessionId })
    const tokens: Tokens = {
      accessToken: 'mock-token-1',
      tokenType: 'bearer',
    }
    await actions.authorize({ authSessionId, tokens, githubUserId })

    const opts = { target: engine.homeAddress }
    const admin = await backchat.actions<actors.Api>('actors', opts)
    const newActorId = await admin.surrender({ authProvider })
    expect(newActorId).toEqual(actorId)
  })
  await t.step('second machine login', async () => {
    const second = await Backchat.upsert(engine, Crypto.generatePrivateKey())

    expect(second.pid).not.toEqual(backchat.pid)
    const actorId = getActorId(second.pid)
    const authSessionId = 'mock-session-id-2'
    await actions.registerAttempt({ actorId, authSessionId })
    const tokens: Tokens = { accessToken: 'mock-token-2', tokenType: 'bearer' }
    await actions.authorize({ authSessionId, tokens, githubUserId })

    const opts = { target: engine.homeAddress }
    const admin = await second.actions<actors.Api>('actors', opts)
    await admin.surrender({ authProvider })

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

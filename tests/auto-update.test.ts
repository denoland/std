import { cradleMaker } from '@/cradle-maker.ts'
import { expect } from '@std/expect/expect'
import { getRoot } from '@/constants.ts'
import { Backchat } from '@/api/client-backchat.ts'

Deno.test('auto update on backchat', async (t) => {
    // log.enable(
    //   'AI:tests AI:execute-tools AI:agents AI:qbr* AI:test-registry AI:test-controller AI:utils AI:test-case-runner',
    // )

    const { backchat, engine, privateKey } = await cradleMaker()
    const path = 'new-file.md'

    expect(await backchat.exists(path)).toBeFalsy()

    const main = getRoot(backchat.pid)
    await backchat.write(path, 'hello world', main)

    expect(await backchat.exists(path)).toBeFalsy()

    const next = await Backchat.upsert(engine, privateKey)

    expect(await next.exists(path)).toBeTruthy()
    await engine.stop()
})

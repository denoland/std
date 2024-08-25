import DB from '@/db.ts'
import { partialFromRepo, SolidRequest } from '@/constants.ts'
import FS from '@/git/fs.ts'
import Accumulator from '@/exe/accumulator.ts'
import IA from '@/isolate-api.ts'

export const createMockApi = async (repo: string) => {
    const db = await DB.create(DB.generateAesKey())
    const partial = partialFromRepo(repo)
    const fs = await FS.init(partial, db)
    const accumulator = Accumulator.create(fs)
    accumulator.activate(Symbol())
    const api = IA.create(accumulator, null as unknown as SolidRequest)

    return { api, stop: () => db.stop() }
}

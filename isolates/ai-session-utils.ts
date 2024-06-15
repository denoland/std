import { IsolateApi, SESSION_BRANCHES, SESSION_PATH } from '@/constants.ts'
import OpenAI from 'openai'
type Messages = OpenAI.ChatCompletionMessageParam

export const rm = (api: IsolateApi) => {
  api.delete(SESSION_PATH)
  api.delete(SESSION_BRANCHES)
}
export const readSession = async (api: IsolateApi) => {
  const session = await api.readJSON<Messages[]>(SESSION_PATH)
  return session
}
export const writeSession = (session: Messages[], api: IsolateApi) => {
  api.writeJSON(SESSION_PATH, session)
  // but this is where we should track the session branches ?
}

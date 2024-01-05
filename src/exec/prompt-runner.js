import merge from 'lodash.merge'
import OpenAI from 'openai'
import Debug from 'debug'
import assert from 'assert-fast'
const debug = Debug('AI:promptRunner')
const model = 'gpt-4-1106-preview'
const env = import.meta.env
const { VITE_OPENAI_API_KEY } = env
const apiKey = VITE_OPENAI_API_KEY
if (!apiKey) {
  throw new Error('missing openai api key')
}
const ai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
})

export default async ({ fs, sessionPath, text, trigger }) => {
  // read in the file
  // add the latest user session
  // ? where would the sysprompt have come from ?

  const session = await fs.readFile(sessionPath, 'utf8')
  const messages = JSON.parse(session)
  messages.push({ role: 'user', content: text })
  const file = JSON.stringify(messages)
  await fs.writeFile(sessionPath, file)
  trigger.write(sessionPath, file)

  const args = {
    model,
    temperature: 0,
    messages,
    stream: true,
    seed: 1337,
  }
  const streamCall = await ai.chat.completions.create(args)
  const assistant = { role: 'assistant' }
  for await (const part of streamCall) {
    const content = part.choices[0]?.delta?.content || ''
    if (!assistant.content) {
      assistant.content = ''
    }
    assistant.content += content

    const toolCalls = part.choices[0]?.delta?.tool_calls
    if (toolCalls) {
      assert(Array.isArray(toolCalls), 'toolCalls must be an array')
      if (!assistant.toolCalls) {
        assistant.toolCalls = []
      }
      for (const call of toolCalls) {
        let { index, ...rest } = call
        assert(Number.isInteger(index), 'toolCalls index must be an integer')

        let args = assistant.toolCalls[index]?.function?.arguments || ''
        args += rest?.function?.arguments || ''
        if (args && isArgsParseable(args)) {
          if (!assistant.toolCalls[index]) {
            assistant.toolCalls[index] = {}
          }
          rest = merge({}, rest, { function: { arguments: JSON.parse(args) } })
          merge(assistant.toolCalls[index], rest)
        }
      }
    }

    // TODO debounce this writing
    // TODO add a ram cache atop the fs
    const file = JSON.stringify([...messages, assistant])
    await fs.writeFile(sessionPath, file)
    trigger.write(sessionPath, file)
  }
}

const isArgsParseable = (args) => {
  try {
    JSON.parse(args)
    return true
  } catch (err) {
    return false
  }
}

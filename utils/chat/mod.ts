import { extract } from './extract.ts'

export const main = async (url: string, output?: string): Promise<void> => {
  const sharedConversationId = url.split('/').pop()
  if (!sharedConversationId) {
    throw new Error(
      'Could not determine sharedConversationId from the provided URL.',
    )
  }

  const resp = await fetch(url)
  if (!resp.ok) {
    throw new Error(`Failed to fetch URL: ${url}, status: ${resp.status}`)
  }

  const html = await resp.text()
  const [creationTime, conversationMarkdown] = await extract(
    html,
    sharedConversationId,
  )

  // creationTime is ISO 8601; we only need YYYY-MM-DD
  const date = creationTime.split('T')[0]
  // shorten the guid (e.g. last 7 chars)
  const shortGuid = sharedConversationId.slice(-7)

  if (!output) {
    output = `chat_${date}_${shortGuid}.md`
  }

  await Deno.writeTextFile(output, conversationMarkdown)

  // deno-lint-ignore no-console
  console.log(`Conversation saved to ${output}`)
}

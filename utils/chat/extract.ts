import { parse } from '@babel/parser'
import { DOMParser, initParser } from '@b-fuze/deno-dom/wasm-noinit'
import * as t from '@babel/types'

interface ConversationMessage {
  id: string
  authorRole?: string
  content?: string
}

interface LinearConvNode {
  id: string
  message?: {
    content?: {
      parts?: string[]
    }
    author?: {
      role?: string
    }
  }
}

export const extract = async (
  htmlContent: string,
  sharedConversationId: string,
): Promise<[string, string]> => {
  await initParser()
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  if (!doc) {
    throw new Error('Could not parse HTML as DOM.')
  }

  let targetScriptContent: string | null = null
  const scripts = doc.querySelectorAll('script')
  for (const script of scripts) {
    const text = script.textContent
    if (text && text.includes(sharedConversationId)) {
      targetScriptContent = text
      break
    }
  }

  if (!targetScriptContent) {
    throw new Error(
      `Could not find a <script> tag containing sharedConversationId ${sharedConversationId}.`,
    )
  }

  const ast = parse(targetScriptContent, {
    sourceType: 'script',
    plugins: ['jsx', 'typescript', 'objectRestSpread'],
  })

  function evaluateObjectExpression(
    node: t.ObjectExpression,
  ): Record<string, unknown> {
    const obj: Record<string, unknown> = {}
    for (const prop of node.properties) {
      if (t.isObjectProperty(prop)) {
        let key: string | undefined
        if (t.isIdentifier(prop.key)) {
          key = prop.key.name
        } else if (t.isStringLiteral(prop.key)) {
          key = prop.key.value
        }

        if (key) {
          let value: unknown
          if (t.isObjectExpression(prop.value)) {
            value = evaluateObjectExpression(prop.value)
          } else if (t.isArrayExpression(prop.value)) {
            value = evaluateArrayExpression(prop.value)
          } else if (t.isStringLiteral(prop.value)) {
            value = prop.value.value
          } else if (t.isNumericLiteral(prop.value)) {
            value = prop.value.value
          } else if (t.isBooleanLiteral(prop.value)) {
            value = prop.value.value
          } else if (t.isNullLiteral(prop.value)) {
            value = null
          } else {
            value = undefined
          }
          obj[key] = value
        }
      }
    }
    return obj
  }

  function evaluateArrayExpression(node: t.ArrayExpression): unknown[] {
    return node.elements.map((elem) => {
      if (!elem) return undefined
      if (t.isObjectExpression(elem)) {
        return evaluateObjectExpression(elem)
      } else if (t.isArrayExpression(elem)) {
        return evaluateArrayExpression(elem)
      } else if (t.isStringLiteral(elem)) {
        return elem.value
      } else if (t.isNumericLiteral(elem)) {
        return elem.value
      } else if (t.isBooleanLiteral(elem)) {
        return elem.value
      } else if (t.isNullLiteral(elem)) {
        return null
      } else {
        return undefined
      }
    })
  }

  let remixContext: Record<string, unknown> | null = null
  for (const statement of ast.program.body) {
    if (
      t.isExpressionStatement(statement) &&
      t.isAssignmentExpression(statement.expression)
    ) {
      const expr = statement.expression
      if (
        t.isMemberExpression(expr.left) &&
        t.isIdentifier(expr.left.object, { name: 'window' }) &&
        t.isIdentifier(expr.left.property, { name: '__remixContext' }) &&
        t.isObjectExpression(expr.right)
      ) {
        remixContext = evaluateObjectExpression(expr.right)
        break
      }
    }
  }

  if (!remixContext) {
    throw new Error('Could not find window.__remixContext in the script.')
  }

  const loaderData = (remixContext.state as Record<string, unknown>)
    ?.loaderData as Record<string, unknown>
  if (!loaderData) {
    throw new Error('Could not find loaderData in __remixContext.')
  }

  const routeDataKey = Object.keys(loaderData).find((k) =>
    k.includes('routes/share.$shareId.($action)')
  )
  if (!routeDataKey) {
    throw new Error(
      'Could not find route data key containing share.$shareId.($action).',
    )
  }

  const routeData = loaderData[routeDataKey] as Record<string, unknown>
  const serverResponse = routeData?.serverResponse as Record<string, unknown>
  if (!serverResponse || !serverResponse.data) {
    throw new Error(
      'Could not find serverResponse.data in the extracted object.',
    )
  }

  const data = serverResponse.data as Record<string, unknown>
  if (data.conversation_id !== sharedConversationId) {
    throw new Error('sharedConversationId does not match expected value.')
  }

  const linearConversation = data.linear_conversation as unknown[]
  if (!Array.isArray(linearConversation)) {
    throw new Error('linear_conversation not found or is not an array.')
  }

  function extractConversationMessages(
    linearConv: unknown[],
  ): ConversationMessage[] {
    const messages: ConversationMessage[] = []
    for (const node of linearConv) {
      const n = node as LinearConvNode
      if (
        n.message &&
        n.message.content &&
        Array.isArray(n.message.content.parts)
      ) {
        const content = n.message.content.parts.join('\n')
        const authorRole = n.message.author?.role
        if (!authorRole) {
          throw new Error('Author role not found.')
        }
        messages.push({
          id: n.id,
          authorRole,
          content,
        })
      }
    }
    return messages
  }

  const conversationMessages = extractConversationMessages(linearConversation)

  // Convert create_time to ISO 8601
  let creationTime = ''
  if (typeof data.create_time === 'number') {
    creationTime = new Date(data.create_time * 1000).toISOString()
  } else if (typeof data.create_time === 'string') {
    const parsed = parseFloat(data.create_time)
    if (!isNaN(parsed)) {
      creationTime = new Date(parsed * 1000).toISOString()
    }
  }
  if (!creationTime) {
    // fallback: just return the raw value if conversion fails
    creationTime = String(data.create_time)
  }

  // Markdown formatting
  let output =
    `# Conversation\nURL: https://chatgpt.com/share/${sharedConversationId}\n\n`
  for (const msg of conversationMessages) {
    output += `### Message ID: ${msg.id}\n`
    output += `**Author**: ${msg.authorRole}\n\n`
    output += `**Content:**\n\n${msg.content}\n\n---\n\n`
  }

  return [creationTime, output.trim()]
}

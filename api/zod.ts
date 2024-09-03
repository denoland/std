import { z } from 'zod'

// Define the schema for content parts (text and image)
const ChatCompletionContentPartTextSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
})

const ChatCompletionContentPartImageSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(['auto', 'low', 'high']).optional(),
  }),
})

const ChatCompletionContentPartRefusalSchema = z.object({
  refusal: z.string(),
  type: z.literal('refusal'),
})

const ChatCompletionContentSchema = z.union([
  z.string(),
  z.array(
    z.union([
      ChatCompletionContentPartTextSchema,
      ChatCompletionContentPartImageSchema,
    ]),
  ),
])

const ChatCompletionContentResponseSchema = z.union([
  z.string(),
  z.array(ChatCompletionContentPartTextSchema),
])

const systemMessage = z.object({
  content: ChatCompletionContentResponseSchema,
  role: z.literal('system'),
  name: z.string().optional(),
})

// Define the user message schema
const userMessage = z.object({
  content: ChatCompletionContentSchema,
  role: z.literal('user'),
  name: z.string().optional(),
})

// Define the assistant message schema
export type AssistantMessage = z.infer<
  typeof assistantMessage
>
export const assistantMessage = z.object({
  role: z.literal('assistant'),
  content: z.union([
    z.string(),
    z.array(z.union([
      ChatCompletionContentPartTextSchema,
      ChatCompletionContentPartRefusalSchema,
    ])),
  ]).optional().nullable(),
  name: z.string().optional(),
  refusal: z.string().optional().nullable(),
  tool_calls: z
    .array(
      z.object({
        id: z.string(),
        type: z.literal('function'),
        function: z.object({
          name: z.string(),
          arguments: z.string(),
        }),
      }),
    )
    .optional(),
})

export type ToolMessage = z.infer<typeof toolMessage>
const toolMessage = z.object({
  role: z.literal('tool'),
  content: ChatCompletionContentResponseSchema,
  tool_call_id: z.string(),
})

export type CompletionMessage = z.infer<typeof completionMessage>
export const completionMessage = z.union([
  systemMessage,
  userMessage,
  assistantMessage,
  toolMessage,
])

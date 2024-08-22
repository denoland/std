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

// Define the content schema that can be either a string or an array of content parts
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

const ChatCompletionSystemMessageParamSchema = z.object({
    content: ChatCompletionContentResponseSchema,
    role: z.literal('system'),
    name: z.string().optional(),
})

// Define the user message schema
const ChatCompletionUserMessageParamSchema = z.object({
    content: ChatCompletionContentSchema,
    role: z.literal('user'),
    name: z.string().optional(),
})

// Define the assistant message schema
export type ChatCompletionAssistantMessageParam = z.infer<
    typeof ChatCompletionAssistantMessageParamSchema
>
export const ChatCompletionAssistantMessageParamSchema = z.object({
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

// Define the tool message schema
const ChatCompletionToolMessageParamSchema = z.object({
    role: z.literal('tool'),
    content: ChatCompletionContentResponseSchema,
    tool_call_id: z.string(),
})

export type ChatCompletionMessageParam = z.infer<
    typeof ChatCompletionMessageParamSchema
>
export const ChatCompletionMessageParamSchema = z.union([
    ChatCompletionSystemMessageParamSchema,
    ChatCompletionUserMessageParamSchema,
    ChatCompletionAssistantMessageParamSchema,
    ChatCompletionToolMessageParamSchema,
])

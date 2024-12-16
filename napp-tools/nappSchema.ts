import { z } from 'zod'

// A napp string: must match format like "@artifact/name"
const nappString = z
  .string()
  .regex(/^@[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/, 'Invalid package name format')

// Generic parameters schema for tools/functions if needed
const parametersSchema = z.object({
  type: z.literal('object').default('object'),
  properties: z.record(z.unknown()).default({}),
  required: z.array(z.string()).optional(),
  description: z.string().optional(),
})

// Schema for a generic JSON function definition
const jsonFunctionSchema = z.object({
  napp: nappString.optional(),
  tool: z.string().optional(),
  description: z.string().optional(),
  parameters: parametersSchema.optional(),
  returns: z.record(z.unknown()).optional(),
  throws: z.record(z.string()).optional(),
})

// Stucks schema
const stucksSchema = z.object({
  napp: nappString,
  tool: z.string(),
  parameters: z.object({
    title: z.string(),
    description: z.string(),
    snapshotId: z.string(),
    crypto: z.string(),
    branch: z.string(),
    expections: z.array(z.string()),
  }),
})

// TODO must have either agent, or main, or tools, else the package is impotent
// TODO if no napp, then must provide parameters.
// TODO if you say tool, then you have to provide napp
// at resolve time, we will resolve to a fully qualified object, where the napp
// can be resolved to self.

// Agent schema
const agentSchema = z.object({
  napp: nappString,
  tool: z.string().optional(),
  parameters: z.object({
    model: z.string(),
    parallel_tool_calls: z.boolean(),
    stop_on_tools: z.array(z.string()),
    tools: z.array(z.string()),
    instructions: z.string().optional(),
  }),
})

// Tools schema: each key is either a nappString or a full jsonFunctionSchema
const toolsSchema = z.record(z.union([jsonFunctionSchema, nappString]))

// Evals schema
const evalsSchema = z.object({
  napp: z.string(),
  parameters: z.object({
    files: z.array(z.string()),
  }),
})

// Dependencies schema
const dependenciesSchema = z.record(z.object({
  name: nappString.optional(),
  version: z.string(),
}))

// Graphics schema: values can be a nappString, a react component definition,
// or a passthrough reference to another napp's graphics
const graphicsItemSchema = z.union([
  nappString,
  z.object({
    type: z.literal('react'),
    path: z.string().optional(),
    parameters: parametersSchema.optional(),
  }),
  z.object({
    napp: nappString,
    graphics: z.string().optional(),
  }),
])
const graphicsSchema = z.record(graphicsItemSchema)

// Effects schema: mount/unmount each a tool invocation (jsonFunctionSchema) or omitted
const effectsSchema = z.object({
  mount: jsonFunctionSchema.optional(),
  unmount: jsonFunctionSchema.optional(),
})

// The main Napp schema
export const nappSchema = z.object({
  name: z.string(),
  version: z.string(),
  'napp-format': z.literal('v1'), // locked to "v1" as per the example
  description: z.string().optional(),
  runtime: z.literal('deno'),

  // optional fields
  branding: z.string().optional(),

  stucks: stucksSchema.optional(),
  agent: agentSchema.optional(),
  tools: toolsSchema.optional(),
  evals: evalsSchema.optional(),
  dependencies: dependenciesSchema.optional(),
  graphics: graphicsSchema.optional(),
  effects: effectsSchema.optional(),
})

export type Napp = z.infer<typeof nappSchema>

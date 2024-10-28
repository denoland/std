import { z } from 'zod'

// either a napp string
const nappString = z.string()
  .regex(/^@[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/, 'Invalid package name format')
  .describe('a napp package string')

const parameters = z.object({
  type: z.literal('object').describe('the type of the parameter'),
  properties: z.record(z.unknown()).describe('the properties of the parameter'),
  required: z.array(z.string()).optional().describe('the required properties'),
  description: z.string().optional().describe(
    'the description of the parameter',
  ),
})

const jsonFunctionSchema = z.object({
  napp: nappString.optional().describe(
    'the napp package to load the function from',
  ),
  tool: z.string().optional().describe('the tool to load the function from'),
  description: z.string().optional().describe(
    'the description of the function',
  ),
  parameters: parameters.optional().describe(
    'the parameters of the function',
  ),
  returns: z.record(z.unknown()).describe('the return type of the function'),
  throws: z.record(
    z.string().describe('the message to return when the error name matches'),
  ).optional(),
})

// TODO must have either agent, or main, or tools, else the package is impotent
// TODO if no napp, then must provide parameters.
// TODO if you say tool, then you have to provide napp
// at resolve time, we will resolve to a fully qualified object, where the napp
// can be resolved to self.

export const nappSchema = z.object({
  name: z.string().describe('the name of the napp package'),
  version: z.string().describe('the version of the napp package'),
  description: z.string().optional().describe(
    'the description of the napp package',
  ),
  runtime: z.enum(['deno']).describe(
    'the runtime of the napp package - only deno is supported currently',
  ),
  tools: z.record(z.union([jsonFunctionSchema, nappString])).optional(),
})
export type Napp = z.infer<typeof nappSchema>

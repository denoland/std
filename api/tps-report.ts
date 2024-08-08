import { z } from 'zod'

const md5 = z.string().regex(/^[a-f0-9]{32}$/, 'Invalid MD5 hash')

const outcome = z.object({
    reasoning: z.array(z.string()),
    outcome: z.boolean(),
    commit: md5.describe('the commit of the branch this test completed on'),
}).describe(
    'the result of a single test run along with chain of thought reasoning for how the outcome was reached',
)

const summary = z.object({
    timestamp: z.number().int().gt(1723003530757).default(Date.now).describe(
        'the time the test run started',
    ),
    elapsed: z.number().int().gte(0).describe(
        'the time the test run took to complete in ms',
    ),
    iterations: z.number().int().gte(0).describe(
        'the number of planned iterations to run',
    ),
    completed: z.number().int().gte(0).default(0).describe(
        'the number of iterations that have completed',
    ),
}).describe(
    'A summary of the test results combining all individual results into a ratio',
)

type SingleTestSchema = z.infer<typeof singleTestSchema>
const singleTestSchema = z.object({
    summary: summary.extend({
        expectations: z.number().int().gte(0).describe(
            'the number of expectations specified for this run',
        ),
        results: z.array(z.object({
            outcomes: z.array(outcome).describe(
                'the results of each interation that has executed so far',
            ),
        })).describe(
            'the results of each interation that has executed so far',
        ),
    }).describe(
        'A summary of the test results combining all individual results into a ratio',
    ),
    outcomes: z.object({
        type: z.literal('array'),
        items: z.object({
            type: z.literal('object'),
            properties: z.object({
                prompt: z.object({
                    type: z.literal('string'),
                    description: z.literal('the prompt that was used'),
                }),
                outcomes: z.object({
                    type: z.literal('array'),
                    items: z.object({
                        type: z.literal('boolean'),
                    }),
                }),
            }),
        }),
    }),
}).describe(
    'Store large numbers of test results in a compact format that supports manipulation and retrieval without needing to load the entire object into context',
)

type TestSuiteSchema = z.infer<typeof testSuiteSchema>
const testSuiteSchema = z.object({
    summary: summary.extend({
        hash: md5.describe(
            'the hash of the test file used to generate the test run',
        ),
        tests: z.number().int().gte(0).describe(
            'the number of tests specified in the test file',
        ),
    }),
    outcomes: z.array(singleTestSchema).describe('the results of each test'),
})

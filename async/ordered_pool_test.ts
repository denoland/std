import { delay } from "./delay.ts"
import { orderedPooledMap } from "./ordered_pool.ts"
import {
	assert,
	assertEquals,
	assertRejects,
	assertStringIncludes
} from "../testing/asserts.ts"

Deno.test("[async] orderedPooledMap", async () => {	

	const start = performance.now()

	const poolLimit = 2
	const array = [1, 2, 3]
	const msPerMapping = 1000
	const iteratorFn = (x: number) => delay(msPerMapping).then( () => x ** 2 )

	const results = orderedPooledMap( poolLimit, array, iteratorFn )

	for await (const [input, result] of results) console.info(input, result)

	const diff = performance.now() - start

	assert(
		diff >= 2000,
		`It took shorter (${diff}ms) than expected (at least 2000ms) to map ${array.length} items, taking ${msPerMapping}ms each, with a pool limit of ${poolLimit}`
	)
	assert(
		diff < 3000,
		`It took longer (${diff}ms) than expected (at most 3000ms) to map ${array.length} items, taking ${msPerMapping}ms each, with a pool limit of ${poolLimit}`
	)
})

Deno.test("[async] orderedPooledMap order", async () => {

	// [1...50]
	const array = Array(50).fill(1).map( (i, v) => i + v )

	const iteratorFn = (x: number) => delay( Math.random() * 1000 ).then( () => x ** 2 )

	const results = orderedPooledMap( 10, array, iteratorFn )

	for await (const [input, result] of results)
		assert(
			input ** 2 == result,
			`input: ${input}\n result: ${result}`
		)

})


Deno.test("[async] orderedPooledMap errors", async () => {
		
	async function mapNumber(n: number): Promise<number> {
		if (n <= 2) throw new Error(`Bad number: ${n}`)
		await delay(100)
		return n
	}

	const mappedNumbers: number[] = []

	await assertRejects(
		async () => {
			for await (const [ _, m ] of orderedPooledMap(3, [1, 2, 3, 4], mapNumber))
				mappedNumbers.push(m)
		},
		(error: Error) => {
			assert(error instanceof AggregateError)
			assertEquals(error.errors.length, 2)
			assertStringIncludes(error.errors[0][1].stack, "Error: Bad number: 1")
			assertStringIncludes(error.errors[1][1].stack, "Error: Bad number: 2")
		}
	)

	assertEquals(mappedNumbers, [3, 4])
})

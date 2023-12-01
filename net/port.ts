/** @returns an open port */
export function getAvailable(): number {
  const tmp = Deno.listen({ port: 0 })
  const { port } = tmp.addr as Deno.NetAddr
  tmp.close()
  return port
}

/**
 * Get a promise that resolves upon successful connection to the specified port.
 * 
 * @param port the port at which to check readiness
 * @param ms the duration of the intervals between re-checking readiness
 * @throws if the inner `Deno.connect` call throws a non `Deno.errors.ConnectionRefused` error.
 */
export async function ready(port: number, ms = 500): Promise<void> {
  while (true) {
    try {
      const connection = await Deno.connect({ port })
      connection.close()
      break
    } catch (e) {
      if (e instanceof Deno.errors.ConnectionRefused) {
        await new Promise((resolve) => setTimeout(resolve, ms))
      }
      else throw e
    }
  }
}
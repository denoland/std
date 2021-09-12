import { Handler } from './mod.ts'

export function router(routes: Map<[RegExp, Request['method']], Handler>): Handler {
    return async (req, con) => {
        const { pathname: path } = new URL(req.url)

        for (const [ [ pattern, method ], handler ] of routes) {
            if (req.method === method && pattern.exec(path) !== null) {
                return await handler(req, con)
            }
        }

        return new Response(null, { status: 404, statusText: 'Route not found' })
    }
}

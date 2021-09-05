import { assertEquals } from '../testing/asserts.ts'
import { HttpRequest, Middleware, addMiddleware } from './middleware.ts'

type AuthedRequest = HttpRequest & { auth: string }

const passThrough: Middleware<HttpRequest> = (req, next) => next!(req)

const authenticate: Middleware<HttpRequest, { auth: string }> = (req, next) => {
    const auth = req.path
    const response = next!({
        ...req,
        auth,
    })

    return response
}

const authorize = <R extends AuthedRequest>(req: R, next?: Middleware<R>) => {
    const isAuthorized = req.auth === 'admin'

    if (!isAuthorized) {
        return { body: 'nope' }
    }

    return next!(req)
}

const rainbow: Middleware<HttpRequest, { rainbow: boolean }> = (req, next) => next!({ ...req, rainbow: true })

const handleGet: Middleware<AuthedRequest> = req => ({ body: 'yey' })

const stack = passThrough
const withAuthentication = addMiddleware(stack, authenticate)
const withAuthorization = addMiddleware(withAuthentication, authorize)
const withRainbow = addMiddleware(withAuthorization, rainbow)
const withHandler = addMiddleware(withRainbow, handleGet)

assertEquals(withHandler({ path: 'someuser' }), { body: 'nope' })
assertEquals(withHandler({ path: 'admin' }), { body: 'yey' })

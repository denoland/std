import { HttpRequest, HttpResponse, Middleware, addMiddleware } from "./middleware.ts"

type AuthedRequest = HttpRequest & { auth: string }

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


const passThrough: Middleware<HttpRequest> = (req, next) => next!(req)

const handleGet: Middleware<AuthedRequest> = req => ({ body: "lawl" })

const stack = passThrough
const withAuthentication = addMiddleware(stack, authenticate)
const withAuthorization = addMiddleware(withAuthentication, authorize)
const handler = addMiddleware(withAuthorization, handleGet)


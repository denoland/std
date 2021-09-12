import { Middleware } from '../middleware.ts'

export const acceptJson: Middleware<Request, { parsedBody: unknown }> = async (req, next) => {
    const body = await req.text()

    let parsedBody: unknown

    try {
        parsedBody = JSON.parse(body)
    } catch(e) {
        if (e instanceof SyntaxError) {
            return new Response(
                e.message,
                { status: 422, statusText: 'Request could not be parsed' }
            )
        }

        throw e
    }

    const nextReq = {
        ...req,
        parsedBody,
    }

    return next!(nextReq)
}

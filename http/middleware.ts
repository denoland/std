export type HttpRequest = { path: string }
export type HttpResponse = { body: string }

export type Middleware<
    Requires extends HttpRequest,
    Adds = {},
> = <Gets extends Requires>(req: Gets, next?: Middleware<Gets & Adds>) => HttpResponse

export function addMiddleware<
    StackAdd,
    HandlerAdd,
>(
    stack: Middleware<HttpRequest, StackAdd>,
    middleware: Middleware<HttpRequest & StackAdd, HandlerAdd>,
): Middleware<HttpRequest, HttpRequest & StackAdd & HandlerAdd> {
    return (req, next) => stack(
        req,
        r => middleware(r, next),
    )
}

type Handler<
    A,
    B = A,
> = (req: A, next?: Handler<B>) => void

function addMiddleware<
    A,
    B,
    C,
>(
    stack: Handler<A, B>,
    middleware: Handler<B, C>,
): Handler<A, B & C> {
    return (req, next) => stack(
        req,
        r => middleware(r, next),
    )
}

const authMiddleware: Handler<{}, { auth: string }> = (req, next) => {
    const auth = 'someuser'
    const response = next({ auth })

    return
}
const handleGet: Handler<{}> = (req: {}) => {}

addMiddleware(
    authMiddleware,
    handleGet,
)

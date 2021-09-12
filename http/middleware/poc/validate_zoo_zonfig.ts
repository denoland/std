import { Middleware } from '../../middleware.ts'
import { includesValue } from '../../../collections/includes_value.ts'
import { AnimalKind, Zoo } from './zoo.ts'

function isZoo(subject: unknown): subject is Zoo {
    const cast = subject as Zoo

    return typeof cast === 'object'
        && typeof cast.name ==='string'
        && typeof cast.entryFee === 'number'
        && Array.isArray(cast.animals)
        && (cast.animals as unknown[]).every(isAnimalKind)
}

function isAnimalKind(subject: unknown): subject is AnimalKind {
    return typeof subject === 'string' && includesValue(AnimalKind, subject)
}

export const validateZoo: Middleware<Request & { parsedBody: unknown }, { zoo: Zoo }> = async (req, next) => {
    const { parsedBody } = req

    if (!isZoo(parsedBody)) {
        return new Response(null, {
            status: 422,
            statusText: 'Invalid ZooConfig',
        })
    }

    const nextReq = {
        ...req,
        zoo: parsedBody,
    }

    return next!(nextReq)
}

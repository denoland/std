import { Middleware } from "../../middleware.ts";
import { includesValue } from "../../../collections/includes_value.ts";
import { Animal, AnimalKind, Zoo } from "./zoo.ts";

function isZoo(subject: unknown): subject is Zoo {
  const cast = subject as Zoo;

  return typeof cast === "object" &&
    typeof cast.name === "string" &&
    typeof cast.entryFee === "number" &&
    Array.isArray(cast.animals) &&
    (cast.animals as unknown[]).every(isAnimal);
}

function isAnimal(subject: unknown): subject is Animal {
  const cast = subject as Animal;

  return typeof cast === "object" &&
    typeof cast.name === "string" &&
    isAnimalKind(cast.kind as unknown);
}

function isAnimalKind(subject: unknown): subject is AnimalKind {
  return typeof subject === "string" && includesValue(AnimalKind, subject);
}

export const validateZoo: Middleware<
  Request & { parsedBody: unknown },
  { zoo: Zoo }
> = async (req, con, next) => {
  const { parsedBody } = req;

  if (!isZoo(parsedBody)) {
    return new Response("Invalid Zoo", { status: 422 });
  }

  const nextReq = {
    ...req,
    zoo: parsedBody,
  };

  return await next!(nextReq, con);
};

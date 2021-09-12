import { router } from "../../router.ts";
import { listenAndServe } from "../../server.ts";
import { acceptYaml } from "../yaml.ts";
import { acceptJson } from "../json.ts";
import { stack } from "../../middleware.ts";
import { validateZoo } from "./validate_zoo_zonfig.ts";
import { Zoo } from "./zoo.ts";

async function createZoo(req: Request & { zoo: Zoo }) {
  const { zoo } = req;
  const responseMessage =
    `Your nice ${zoo.name} Zoo was created. Take good care of your ${zoo.animals.length} animals!`;

  return new Response(responseMessage, {
    status: 201,
    statusText: "Zoo created",
  });
}

const handleCreateZoo = stack(validateZoo)
  .add(createZoo)
  .handler;

const handler = router(new Map([
    [
        [ /^\/zoos\/yaml$/, 'POST' ],
        stack(acceptYaml)
            .add(handleCreateZoo)
            .handler,
    ],
    [
        [ /^\/zoos\/json/, 'POST' ],
        stack(acceptJson)
            .add(handleCreateZoo)
            .handler,
    ],
]))

await listenAndServe('', handler)

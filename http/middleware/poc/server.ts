import { route } from "../router.ts"
import { distinctBy } from "../../../collections/mod.ts";
import { listenAndServe } from "../../server.ts";
import { acceptYaml } from "../yaml.ts";
import { acceptJson } from "../json.ts";
import { log } from "../log.ts";
import { stack, addMiddleware } from "../../middleware.ts";
import { validateZoo } from "./validate_zoo_zonfig.ts";
import { Zoo } from "./zoo.ts";

function createZoo(req: Request & { zoo: Zoo }) {
  const { zoo } = req;
  const responseMessage = `
Your nice ${zoo.name} Zoo was created.

Take good care of your ${zoo.animals.length} animals!
All those ${
    distinctBy(zoo.animals, (it) => it.kind).map((it) => `${it.kind}s`).join(
      " and ",
    )
  } will surely amaze your visitors.
`;

  return Promise.resolve(new Response(responseMessage, { status: 201 }));
}

const handleCreateZoo = stack(validateZoo)
  .add(createZoo)
  .handler;

addMiddleware(log, handleCreateZoo)
//await listenAndServe(":5000", handler);

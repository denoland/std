//import { route } from "../router.ts";
import { distinctBy } from "../../../collections/mod.ts";
import { listenAndServe } from "../../server.ts";
import { acceptJson } from "../json.ts";
import { log } from "../log.ts";
import { Middleware, stack } from "../../middleware.ts";
import { validateZoo } from "./validate_zoo_zonfig.ts";
import { Zoo } from "./zoo.ts";

const createZoo: Middleware<Request & { zoo: Zoo }> = (req, con) => {
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
};

const handleCreateZoo = stack(log)
  .add(acceptJson)
  .add(validateZoo)
  .add(createZoo)
  .handler;

await listenAndServe("0.0.0.0:5000", handleCreateZoo);

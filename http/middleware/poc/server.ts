import { distinctBy } from "../../../collections/mod.ts";
import { listenAndServe } from "../../server.ts";
import { acceptJson } from "../json.ts";
import { log } from "../log.ts";
import { stack } from "../../middleware.ts";
import { HttpRequest } from "../../request.ts";
import { validateZoo } from "./validate_zoo.ts";
import { Zoo } from "./zoo.ts";

function createZoo(req: HttpRequest<{ zoo: Zoo }>) {
  const { zoo } = req.context;
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

function passThrough(
  req: HttpRequest,
  next?: (r: HttpRequest) => Promise<Response>,
) {
  return next!(req);
}

const handleCreateZoo = stack(log)
  .add(passThrough)
  .add(acceptJson)
  .add(validateZoo)
  .add(createZoo)
  .handler;

await listenAndServe(
  "0.0.0.0:5000",
  handleCreateZoo,
);

import { Type } from "../Type.ts";
import { Any } from "../utils.ts";

export const seq = new Type("tag:yaml.org,2002:seq", {
  construct(data): Any {
    return data !== null ? data : [];
  },
  kind: "sequence"
});

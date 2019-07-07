import { Type } from "../type.ts";
import { Any } from "../utils.ts";

export const map = new Type("tag:yaml.org,2002:map", {
  construct(data): Any {
    return data !== null ? data : {};
  },
  kind: "mapping"
});

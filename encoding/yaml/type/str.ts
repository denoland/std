import { Type } from "../Type.ts";

export const str = new Type("tag:yaml.org,2002:str", {
  construct(data): string {
    return data !== null ? data : "";
  },
  kind: "scalar"
});

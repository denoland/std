import { promptSelect } from "./unstable_prompt_select.ts";

const list = [];

for (let i = 0; i < 100; i++) {
  list.push(`${i}`);
}

promptSelect("Select", list);

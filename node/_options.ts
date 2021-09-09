import { getOptions } from "./internal_binding/options.ts";

let optionsMap: Map<string, { value: string }>;

function getOptionsFromBinding() {
  if (!optionsMap) {
    ({ options: optionsMap } = getOptions());
  }

  return optionsMap;
}

export function getOptionValue(optionName: string) {
  const options = getOptionsFromBinding();

  if (optionName.startsWith("--no-")) {
    const option = options.get("--" + optionName.slice(5));

    return option && !option.value;
  }

  return options.get(optionName)?.value;
}

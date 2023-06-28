// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { INPUT_STYLES } from "@/utils/constants.ts";

export default function PageInput(
  props: { lastPage: number; currentPage: number },
) {
  return (
    <input
      id="current_page"
      class={INPUT_STYLES}
      type="number"
      name="page"
      min="1"
      max={props.lastPage}
      value={props.currentPage}
      // @ts-ignore Property 'form' does exist on type 'EventTarget'.
      onChange={(event) => event.srcElement!.form.submit()}
    />
  );
}

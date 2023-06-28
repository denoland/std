// Copyright 2023 the Deno authors. All rights reserved. MIT license.

export default function PageInput(
  props: { lastPage: number; currentPage: number },
) {
  return (
    <input
      id="current_page"
      class={`bg-transparent rounded rounded-lg outline-none w-full border-1 border-gray-500 hover:border-black transition duration-300 disabled:(opacity-50 cursor-not-allowed) rounded-md px-2 py-1 dark:(hover:border-white)`}
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

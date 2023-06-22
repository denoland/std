// Copyright 2023 the Deno authors. All rights reserved. MIT license.

export default function PageSelector(
  props: { currentPage: number; lastPage: number; timeSelector?: string },
) {
  return (
    <div class="flex justify-center py-4 mx-auto">
      <form class="inline-flex items-center gap-x-2">
        {props.timeSelector &&
          <input type="hidden" name="time-ago" value={props.timeSelector} />}
        <input
          id="current_page"
          class={`bg-transparent rounded rounded-lg outline-none w-full border-1 border-gray-500 hover:border-black transition duration-300 disabled:(opacity-50 cursor-not-allowed) rounded-md px-2 py-1 dark:(hover:border-white)`}
          type="number"
          name="page"
          min="1"
          max={props.lastPage}
          value={props.currentPage}
          // @ts-ignore: this is valid HTML
          onChange={() => this.form.submit()}
        />
        <label for="current_page" class="whitespace-nowrap align-middle">
          of {props.lastPage}
        </label>
      </form>
    </div>
  );
}

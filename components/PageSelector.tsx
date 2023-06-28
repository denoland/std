// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import PageInput from "@/islands/PageInput.tsx";

export default function PageSelector(
  props: { currentPage: number; lastPage: number; timeSelector?: string },
) {
  return (
    <div class="flex justify-center py-4 mx-auto">
      <form class="inline-flex items-center gap-x-2">
        {props.timeSelector &&
          <input type="hidden" name="time-ago" value={props.timeSelector} />}
        <PageInput {...props} />
        <label for="current_page" class="whitespace-nowrap align-middle">
          of {props.lastPage}
        </label>
      </form>
    </div>
  );
}

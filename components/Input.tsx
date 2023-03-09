/** Taken from {@link https://fresh.deno.dev/components} with changes:
 * 1. Removed `IS_BROWSER` comparison
 */
import { JSX } from "preact";

export default function Input(props: JSX.HTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      class={`px-3 py-2 bg-white rounded ring-1 ring-gray-300 shadow-md disabled:(opacity-50 cursor-not-allowed) ${
        props.class ?? ""
      }`}
    />
  );
}

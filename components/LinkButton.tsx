import { JSX } from "preact";

export default function LinkButton(
  props: JSX.HTMLAttributes<HTMLAnchorElement>,
) {
  return (
    <a
      {...props}
      class={`px-4 py-2 bg-pink-700 text-white text-lg rounded-full hover:bg-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
        props.class ?? ""
      }`}
    />
  );
}

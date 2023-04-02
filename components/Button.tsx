import { JSX } from "preact";

export default function Button(
  props: JSX.HTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      class={`px-4 py-2 bg-pink-700 text-white text-lg rounded-full hover:bg-black transition duration-300 disabled:(opacity-50 cursor-not-allowed) ${
        props.class ?? ""
      }`}
    />
  );
}

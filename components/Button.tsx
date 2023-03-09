import { JSX } from "preact";

export default function Button(
  props: JSX.HTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      class={`px-8 py-2 bg-pink-700 text-white text-lg rounded-full hover:bg-black transition duration-300 ${
        props.class ?? ""
      }`}
    />
  );
}

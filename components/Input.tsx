import { JSX } from "preact";

export default function Input(props: JSX.HTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      class={`px-3 py-2 bg-white rounded border-1 border-gray-300 shadow-md disabled:(opacity-50 cursor-not-allowed) ${
        props.class ?? ""
      }`}
    />
  );
}

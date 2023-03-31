import { JSX } from "preact";

export default function Notice(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      class={`px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 ${
        props.class ?? ""
      }`}
    />
  );
}

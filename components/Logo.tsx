import { JSX } from "preact";
import { SITE_NAME } from "@/constants.ts";

export default function Logo(props: JSX.HTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      src="/logo.png"
      alt={`${SITE_NAME} logo`}
      class={`h-24 w-auto mx-auto ${props.class ?? ""}`}
    />
  );
}

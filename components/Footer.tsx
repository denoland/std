// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { SITE_NAME } from "@/constants.ts";
import { JSX } from "preact";

export default function Footer(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <footer
      {...props}
      class={`flex flex-col md:flex-row w-full p-8 justify-between gap-y-4 mx-auto max-w-7xl ${
        props.class ?? ""
      }`}
    >
      <span>
        <strong>{SITE_NAME}</strong>
      </span>
      {props.children}
    </footer>
  );
}

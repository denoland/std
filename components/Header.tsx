import { SITE_NAME } from "../constants.ts";
import Nav from "./Nav.tsx";
import { JSX } from "preact";

function HeaderLogo() {
  return (
    <a href="/">
      <strong class="font-bold text-2xl flex-1">{SITE_NAME}</strong>
    </a>
  );
}

export default function Header(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <header
      {...props}
      class={`p-8 justify-between mx-auto max-w-7xl w-full flex z-10 ${
        props.class ?? ""
      }`}
    >
      <HeaderLogo />
      {props.children}
    </header>
  );
}

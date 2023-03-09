import { SITE_NAME } from "../constants.ts";
import Nav from "./Nav.tsx";

function HeaderLogo() {
  return <strong class="font-bold text-2xl">{SITE_NAME}</strong>;
}

export default function Header() {
  const navItems = [
    {
      href: "/",
      inner: <HeaderLogo />,
    },
    {
      href: "/dashboard",
      inner: "Dashboard",
    },
  ];

  return (
    <header class="p-8 justify-between mx-auto max-w-7xl w-full text-white">
      <Nav items={navItems} />
    </header>
  );
}

import type { ComponentChildren } from "preact";
import Header, { type HeaderProps } from "./Header.tsx";
import Footer from "./Footer.tsx";

export interface LayoutProps extends HeaderProps {
  children: ComponentChildren;
}

export default function Layout(props: LayoutProps) {
  return (
    <div class="flex flex-col min-h-screen">
      <Header {...props} />
      {props.children}
      <Footer />
    </div>
  );
}

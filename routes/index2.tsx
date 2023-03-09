import Nav from "@/components/Nav.tsx";
import Head from "@/components/Head.tsx";
import { SITE_DESCRIPTION, SITE_NAME } from "@/constants.ts";
import Button from "@/components/Button.tsx";
import type { Handlers, PageProps } from "$fresh/server.ts";
import { stripe } from "@/utils/stripe.ts";
import Stripe from "stripe";

function sortProductsFromLowestPrice(products: Stripe.Product[]) {
  return products.sort((productA, productB) =>
    (productA.default_price as Stripe.Price).unit_amount! -
    (productB.default_price as Stripe.Price).unit_amount!
  );
}

export const handler: Handlers<Stripe.Product[]> = {
  async GET(_, ctx) {
    const { data } = await stripe.products.list({
      expand: ["data.default_price"],
      active: true,
    });

    return await ctx.render(sortProductsFromLowestPrice(data));
  },
};

function HeaderLogo() {
  return <span class="font-bold text-2xl">{SITE_NAME}</span>;
}

function Header() {
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
    <div class="bg-black">
      <header class="p-8 justify-between mx-auto max-w-5xl w-full text-white">
        <Nav items={navItems} />
      </header>
    </div>
  );
}

function PricingItem(props: { product: Stripe.Product }) {
  return (
    <div
      style="background: rgb(52 56 129 / 80%); backdrop-filter: blur(4px);"
      class="flex-1 space-y-4 p-4 text-white ring-1 ring-gray-500 shadow-lg rounded-xl text-center"
    >
      <div>
        <h3 class="text-2xl font-bold">
          {props.product.name}
        </h3>
        <p>{props.product.description}</p>
      </div>
      <p class="font-bold text-xl">
        ${(props.product.default_price as Stripe.Price).unit_amount! / 100}
        <span class="font-normal">{" "}per month</span>
      </p>
      <div>
        <a href="/signup">
          <Button class="w-full rounded-md">Subscribe</Button>
        </a>
      </div>
    </div>
  );
}

function Hero(props: { products: Stripe.Product[] }) {
  return (
    <div class="p-8 mx-auto max-w-5xl w-full space-y-8 flex-1 flex flex-col justify-center">
      <div class="space-y-4 text-white">
        <h1 class="font-bold md:text-6xl text-3xl">
          {SITE_DESCRIPTION}
        </h1>
        <p class="text-xl">Lorem ipsum dolor sit amet, consectetur.</p>
      </div>
      <div class="flex gap-4 flex-wrap">
        <a href="/signup">
          <Button class="text-lg">
            Sign up
          </Button>
        </a>
        <a href="#">
          <Button class="text-lg bg-white border-2 border-pink-600 text-pink-600">
            Find out more
          </Button>
        </a>
      </div>
      <div class="flex gap-4 md:flex-row flex-col">
        {props.products.map((product) => <PricingItem product={product} />)}
      </div>
    </div>
  );
}

function Footer() {
  const navItems = [
    {
      href: "#",
      inner: "GitHub",
    },
  ];

  return (
    <div class="bg-gradient-to-t from-black">
      <footer class="flex flex-col md:flex-row w-full p-8 justify-between gap-y-4 mx-auto max-w-5xl text-white">
        <span>
          <strong>{SITE_NAME}</strong>
        </span>
        <Nav items={navItems} />
      </footer>
    </div>
  );
}

export default function HomePage(props: PageProps<Stripe.Product[]>) {
  return (
    <>
      <Head />
      <body
        class="h-screen flex flex-col bg-cover bg-black"
        style="background-image: url('/hero.svg')"
      >
        <Header />
        <Hero products={props.data} />
        <Footer />
      </body>
    </>
  );
}

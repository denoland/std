// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import Head from "@/components/Head.tsx";
import Header from "@/components/Header.tsx";
import Nav from "@/components/Nav.tsx";
import Footer from "@/components/Footer.tsx";
import IconListDetails from "tabler-icons/list-details.tsx";
import IconCheckbox from "tabler-icons/checkbox.tsx";
import IconPrompt from "tabler-icons/prompt.tsx";
import type { Handlers, PageProps } from "$fresh/server.ts";
import { formatAmountForDisplay, stripe } from "@/utils/stripe.ts";
import type { Stripe } from "stripe";
import { BASE_BUTTON_STYLES, FREE_PLAN_TODOS_LIMIT } from "@/constants.ts";

interface HeadingProps {
  title: string;
  subtitle?: string;
}

function Heading(props: HeadingProps) {
  return (
    <div class="text-center space-y-4">
      <h2 class="font-bold md:text-6xl text-4xl text-primary">
        {props.title}
      </h2>
      <p class="text-xl text-black">
        {props.subtitle}
      </p>
    </div>
  );
}

function Hero() {
  return (
    <div class="text-center px-8 py-16 max-w-7xl mx-auto text-white space-y-8 flex-1 flex flex-col justify-center mt-[-112px]">
      <h1 class="font-bold text-3xl md:text-7xl">
        Your SaaS here.
      </h1>
      <p class="text-xl">
        Some details about your SaaS.
      </p>
      <div class="flex justify-center gap-8 flex-wrap">
        <a href="/signup" class={BASE_BUTTON_STYLES}>Signup</a>
        <a
          href="#"
          class={`${BASE_BUTTON_STYLES} !bg-white border-2 border-pink-700 !text-pink-700 hover:border-black hover:!text-black transition duration-300`}
        >
          Learn more
        </a>
      </div>
    </div>
  );
}

function TopSection() {
  const navItems = [
    {
      href: "/blog",
      inner: "Blog",
    },
    {
      href: "/dashboard",
      inner: "Dashboard",
    },
  ];

  return (
    <div
      style="background-image: url('/hero-dark.svg')"
      class="min-h-screen bg-cover flex flex-col"
    >
      <Header class="text-white">
        <Nav items={navItems} />
      </Header>
      <Hero />
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: IconListDetails,
      title: "First feature",
      description: "A little description here.",
    },
    {
      icon: IconCheckbox,
      title: "Second feature",
      description: "A little description here.",
    },
    {
      icon: IconPrompt,
      title: "Third feature",
      description: "A little description here.",
    },
  ];

  return (
    <>
      <div class="bg-secondary" id="features">
        <div class="px-8 py-16 max-w-7xl space-y-16 mx-auto text-white">
          <div class="flex md:flex-row flex-col gap-8">
            {features.map((feature) => (
              <div class="flex-1 space-y-2 text-center">
                <feature.icon class="h-12 w-auto mx-auto" />
                <h2 class="text-2xl font-bold">
                  {feature.title}
                </h2>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        class="h-16 bg-cover bg-bottom w-full"
        style="background-image: url('/transition.svg')"
      >
      </div>
    </>
  );
}

interface PricingCardProps {
  name: string;
  description: string;
  price_per_month: string;
  url: string;
}

function PricingCard(props: PricingCardProps) {
  return (
    <div class="flex-1 space-y-4 p-4 ring-1 ring-gray-300 rounded-xl text-center">
      <div>
        <h3 class="text-2xl font-bold">
          {props.name}
        </h3>
        <p>{props.description}</p>
      </div>
      <p class="font-bold text-xl">
        {props.price_per_month}
        <span class="font-normal">{" "}per month</span>
      </p>
      <a
        href={props.url}
        class={`${BASE_BUTTON_STYLES} w-full rounded-md block`}
      >
        Subscribe
      </a>
    </div>
  );
}

function PricingSection(props: { products: Stripe.Product[] }) {
  return (
    <div id="pricing" class="px-8 py-16 max-w-7xl space-y-16 mx-auto">
      <Heading
        title="Pricing"
        subtitle="Some copy about pricing."
      />
      <div class="flex flex-col md:flex-row gap-8">
        <div class="flex-1">
          <img src="/pricing.svg" alt="Pricing image" />
        </div>
        <div class="flex-1 flex flex-col gap-8">
          <PricingCard
            name="Free tier"
            description={`Limited to ${FREE_PLAN_TODOS_LIMIT} todos`}
            price_per_month={"$0"}
            url="/signup"
          />
          {props.products.map((product) => (
            // TODO: make user subscribed upon signup via URL param
            <PricingCard
              name={product.name}
              description={product.description!}
              price_per_month={formatAmountForDisplay(
                (product.default_price as Stripe.Price)
                  ?.unit_amount ?? 0,
                (product.default_price as Stripe.Price)
                  ?.currency ?? "usd",
              )}
              url="/signup"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialSection() {
  return (
    <div class="px-8 py-16 max-w-7xl space-y-16 mx-auto" id="testimonial">
      <Heading title="Testimonial" />
      <div class="text-center text-lg space-y-8">
        <img
          src="brad.webp"
          alt="Brad, CEO of Good Things"
          class="h-16 w-auto rounded-full mx-auto"
        />
        <p class="text-2xl">"This app is a game changer."</p>
        <div>
          <p>
            <strong class="text-primary">Brad</strong>
          </p>
          <p>CEO of Good Things</p>
        </div>
      </div>
    </div>
  );
}

function BottomSection() {
  const navItems = [
    {
      inner: "Source code",
      href: "https://github.com/denoland/saaskit",
    },
    {
      href: "https://fresh.deno.dev",
      inner: (
        <img
          width="197"
          height="37"
          src="https://fresh.deno.dev/fresh-badge.svg"
          alt="Made with Fresh"
        />
      ),
    },
  ];

  return (
    <>
      <img src="/hero-light.svg" alt="Hero (light)" class="w-full" />
      <div class="bg-gradient-to-t from-black to-secondary">
        <Footer class="text-white">
          <Nav items={navItems} />
        </Footer>
      </div>
    </>
  );
}

function sortProductsFromLowestPrice(products: Stripe.Product[]) {
  return products.sort((productA, productB) =>
    ((productA.default_price as Stripe.Price)?.unit_amount ?? 0) -
    ((productB.default_price as Stripe.Price)?.unit_amount ?? 0)
  );
}

export const handler: Handlers<Stripe.Product[]> = {
  async GET(_request, ctx) {
    const { data } = await stripe.products.list({
      expand: ["data.default_price"],
      active: true,
    });

    return await ctx.render(sortProductsFromLowestPrice(data));
  },
};

export default function HomePage(props: PageProps<Stripe.Product[]>) {
  return (
    <>
      <Head href={props.url.href} />
      <TopSection />
      <FeaturesSection />
      <PricingSection products={props.data} />
      <TestimonialSection />
      <BottomSection />
    </>
  );
}

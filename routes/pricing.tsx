// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import { BUTTON_STYLES } from "@/utils/constants.ts";
import {
  formatAmountForDisplay,
  isProductWithPrice,
  stripe,
  StripProductWithPrice,
} from "@/utils/payments.ts";
import Stripe from "stripe";
import { getUserBySession, type User } from "@/utils/db.ts";
import { Check } from "@/components/Icons.tsx";

interface PricingPageData extends State {
  products: Stripe.Product[];
  user: User | null;
}

function comparePrices(
  productA: StripProductWithPrice,
  productB: StripProductWithPrice,
) {
  return (productA.default_price.unit_amount || 0) -
    (productB.default_price.unit_amount || 0);
}

export const handler: Handlers<PricingPageData, State> = {
  async GET(_req, ctx) {
    if (stripe === undefined) return ctx.renderNotFound();

    const { data } = await stripe.products.list({
      expand: ["data.default_price"],
      active: true,
    });

    const productsWithPrice = data.filter(isProductWithPrice);

    if (productsWithPrice.length !== data.length) {
      throw new Error(
        "Not all products have a default price. Please run the `deno task init:stripe` as the README instructs.",
      );
    }

    ctx.state.title = "Pricing";

    const products = productsWithPrice.sort(comparePrices);

    const user = ctx.state.sessionId
      ? await getUserBySession(ctx.state.sessionId)
      : null;

    return ctx.render({ ...ctx.state, products, user });
  },
};

const CARD_STYLES =
  "shadow-md flex flex-col flex-1 space-y-8 p-8 ring-1 ring-gray-300 rounded-xl dark:bg-gray-700 bg-gradient-to-r";
const CHECK_STYLES = "w-6 h-6 text-primary shrink-0 inline-block mr-2";

function FreePlanCard() {
  return (
    <div class={CARD_STYLES}>
      <div class="flex-1 space-y-4">
        <div>
          <h2 class="text-xl font-bold">
            Free
          </h2>
          <p class="text-gray-500">
            Discover and share your favorite Deno projects.
          </p>
        </div>
        <p>
          <span class="text-4xl font-bold">Free</span>
        </p>
        <p>
          <Check class={CHECK_STYLES} />
          Share
        </p>
        <p>
          <Check class={CHECK_STYLES} />
          Comment
        </p>
        <p>
          <Check class={CHECK_STYLES} />
          Vote
        </p>
      </div>

      <div class="text-center">
        <a
          href="/account/manage"
          class={`${BUTTON_STYLES} w-full rounded-md block`}
        >
          Manage
        </a>
      </div>
    </div>
  );
}

function PremiumPlanCard(
  props: { product: Stripe.Product; isSubscribed?: boolean },
) {
  const defaultPrice = props.product.default_price as Stripe.Price;
  return (
    <div class={CARD_STYLES + " border-primary border"}>
      <div class="flex-1 space-y-4">
        <div>
          <h2 class="text-xl font-bold">
            {props.product.name}
          </h2>
          <p class="text-gray-500">
            {props.product.description}
          </p>
        </div>
        <p>
          <span class="text-4xl font-bold">
            {formatAmountForDisplay(
              defaultPrice.unit_amount! / 100,
              defaultPrice?.currency,
            )}
          </span>
          <span>{" "}/ {defaultPrice.recurring?.interval}</span>
        </p>
        <p>
          <Check class={CHECK_STYLES} />
          Your comments appear first
        </p>
        <p>
          <Check class={CHECK_STYLES} />
          Downvoting
        </p>
        <p>
          <Check class={CHECK_STYLES} />
          Official pro user badge 🦕
        </p>
      </div>

      <div class="text-center">
        {props.isSubscribed
          ? (
            <a
              class={`${BUTTON_STYLES} w-full rounded-md block`}
              href="/account/manage"
            >
              Manage
            </a>
          )
          : (
            <a
              class={`${BUTTON_STYLES} w-full rounded-md block`}
              href="/account/upgrade"
            >
              Upgrade
            </a>
          )}
      </div>
    </div>
  );
}

function EnterprisePricingCard() {
  return (
    <div class={CARD_STYLES}>
      <div class="flex-1 space-y-4">
        <div>
          <h2 class="text-xl font-bold">
            Enterprise
          </h2>
          <p class="text-gray-500">
            Make the Deno Hunt experience yours.
          </p>
        </div>
        <p>
          <span class="text-4xl font-bold">Contact us</span>
        </p>
        <p>
          <Check class={CHECK_STYLES} />
          Advanced reporting
        </p>
        <p>
          <Check class={CHECK_STYLES} />
          Direct line to{" "}
          <a href="/user/lambtron" class="text-secondary">Andy</a> and{" "}
          <a href="/user/iuioiua" class="text-secondary">Asher</a>
        </p>
        <p>
          <Check class={CHECK_STYLES} />
          Complimentary Deno merch
        </p>
      </div>

      <div class="text-center">
        <a
          href="mailto:andy@deno.com"
          class={`${BUTTON_STYLES} w-full rounded-md block`}
        >
          Contact us
        </a>
      </div>
    </div>
  );
}

export default function PricingPage(props: PageProps<PricingPageData>) {
  /** @todo Maybe just retrieve a single product within the handler. Documentation may have to be adjusted. */
  const [product] = props.data.products;

  return (
    <main class="mx-auto max-w-5xl w-full flex-1 flex flex-col justify-center px-4">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold">Pricing</h1>
        <p class="text-gray-500">Choose the plan that suites you</p>
      </div>
      <div class="flex flex-col md:flex-row gap-4">
        <FreePlanCard />
        <PremiumPlanCard
          product={product}
          isSubscribed={props.data.user?.isSubscribed}
        />
        <EnterprisePricingCard />
      </div>
    </main>
  );
}

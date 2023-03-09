import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import { stripe } from "@/utils/stripe.ts";
import { Stripe } from "stripe";
import type { User } from "@supabase/supabase-js";
import type { DashboardState } from "./_middleware.ts";
import DashboardLayout from "@/components/DashboardLayout.tsx";

interface AccountPageData {
  user: User;
  billingSession: Stripe.Response<Stripe.BillingPortal.Session>;
}

export const handler: Handlers<AccountPageData, DashboardState> = {
  async GET(request, ctx) {
    const { data: { user }, error } = await ctx.state.supabaseClient.auth
      .getUser();
    if (error) throw error;

    const customer = user!.user_metadata.stripe_customer_id;
    const returnUrl = new URL(request.url).href;

    const billingSession = await stripe.billingPortal.sessions.create({
      customer,
      return_url: returnUrl,
    });

    return await ctx.render({
      user: user!,
      billingSession,
    });
  },
};

export default function AccountPage(props: PageProps<AccountPageData>) {
  return (
    <>
      <Head title="Account" />
      <DashboardLayout active="/dashboard/account">
        <ul class="space-y-2">
          <li class="flex items-center justify-between gap-2 py-2">
            <div class="flex-1">
              <strong>Email</strong>
            </div>
            <div>{props.data.user.email}</div>
          </li>
          <li class="flex items-center justify-between gap-2 py-2">
            <div class="flex-1">
              <strong>Manage subscription</strong>
            </div>
            <a class="underline" href={props.data.billingSession.url}>
              Go to customer portal
            </a>
          </li>
        </ul>
      </DashboardLayout>
    </>
  );
}

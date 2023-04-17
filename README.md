# Deno SaaSKit

> Warning: this project is in beta. Design, workflows, and user accounts are
> subject to change.

[![Discord Chat](https://img.shields.io/discord/684898665143206084?logo=discord&style=social)](https://discord.gg/deno)

[Deno SaaSKit](https://deno.com/saaskit) is an open-sourced, highly performant
template for building your SaaS quickly and easily.

## Features

- [No build step](https://deno.com/blog/you-dont-need-a-build-step#non-building-with-deno-and-fresh)
- Deno's built-in [formatter](https://deno.land/manual/tools/formatter),
  [linter](https://deno.land/manual/tools/linter) and
  [test runner](https://deno.land/manual/basics/testing) and TypeScript support.
- User authentication with [Supabase Auth](https://supabase.com/auth), including
  email/password and OAuth flows.
- Session management
- Database management with [Supabase Database](https://supabase.com/database)
  and Row-Level Security (RLS).
- Billing management with [Stripe](https://stripe.com/).
- [Fresh](https://fresh.deno.dev/) as the web framework and
  [Tailwind CSS](https://tailwindcss.com/) as the CSS framework.

Want to know where Deno SaaSKit is headed? Check out
**[our roadmap](https://github.com/denoland/saaskit/issues/60)**.

## Getting Started Locally

### Prerequisites

- [Deno](https://deno.com/manual/getting_started/installation)
- [Docker](https://docs.docker.com/engine/install/)
- [Git](https://github.com/git-guides/install-git)
- [A free Stripe account](https://stripe.com)
- [Stripe CLI](https://stripe.com/docs/stripe-cli#install)
- [A free Supabase account](https://supabase.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Setup the repo

1. Clone the repo:

```
git clone https://github.com/denoland/saaskit.git
cd saaskit
```

2. Create a `.env` file to store environmental variables:

```
cp .example.env .env
```

### Auth and Database (Supabase)

The values of these environmental variables will be gathered in the following
steps.

1. While Docker is running, start the Supabase services:

```
supabase start
```

This will automatically configure the database tables and their settings for us.

2. Copy the values of the printed Supabase `API URL`, `anon key`, and
   `service_role key` variables into the environmental variables in your `.env`
   file as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_KEY`,
   respectively.

### Payments and Subscriptions (Stripe)

1. Copy your Stripe secret key as `STRIPE_SECRET_KEY` into your `.env` file. We
   recommend using the test key for your development environment.
2. Run `deno task init:stripe` and follow the instructions. This automatically
   creates your "Premium tier" product and configures the Stripe customer
   portal.

> Note: go to [tools/init_stripe.ts](tools/init_stripe.ts) if you'd like to
> learn more about how the `init:stripe` task works.

3. Listen locally to Stripe events:

```
stripe listen --forward-to localhost:8000/api/subscription
```

4. Copy the webhook signing secret to [.env](.env) as `STRIPE_WEBHOOK_SECRET`.

### Running the Server

Finally, start the server by running:

```
deno task start
```

Go to [http://localhost:8000](http://localhost:8000) to begin playing with your
new SaaS app.

> Note: You can use
> [Stripe's test credit cards](https://stripe.com/docs/testing) to make test
> payments while in Stripe's test mode.

## Deploying to Production

This section shows how to get your SaaS ready for production and deploy it.

### Authentication

TODO

### Payments

[Set up your branding on Stripe](https://dashboard.stripe.com/settings/branding),
as a user will be taken to Stripe's checkout page when they upgrade.

Keep your `customers` database up to date with billing changes by
[registering a webhook endpoint in Stripe](https://stripe.com/docs/development/dashboard/register-webhook).

- Endpoint URL: `https://{{ YOUR DOMAIN }}/api/subscription`
- Listen to `Events on your account`
- Select: `customer.subscription.created` and `customer.subscription.deleted`

### Deno Deploy

TODO

### Any VPS via Docker

TODO

## Extending Deno SaaSKit

### Global Constants

The [utils/constants.ts](utils/constants.ts) file includes global values used
across various aspects of the codebase. Update these values according to your
needs.

### Blog

To create a new blog post, create a Markdown (`.md`) file within
[`/data/posts/`](data/posts) with the filename as the slug. E.g.
`/data/blog/hello-there.md` will correspond to the `/blog/hello-there` route.
See [`/data/posts/`](data/posts) for examples.

Post properties are to be added to the starting Front Matter section of the
Markdown file. See the `Post` interface in [`/utils/posts.ts`](utils/posts.ts)
for a full list of properties and their types.

### Themes

You can customize theme options such as spacing, color, etc. By default, Deno
SaaSKit comes with `primary` and `secondary` colors predefined within
`twind.config.ts`. Change these values to match your desired color scheme.

## Architecture

### Authentication

TODO:

- Blog
- Database
- Formatting
- Fresh
- Linting
- Payments
- Testing

## Contributing

When submitting a pull request, please:

1. Follow the
   [Deno Style Guide](https://deno.land/manual/references/contributing/style_guide).
2. Include tests for any added functionality.
3. Ensure `deno task test` passes successfully.

## Goals and Philosophy

For the user, the website should be fast, secure and have a design with clear
intent. Additionally, the HTML should be well-structured and indexable by search
engines. The defining metrics for these goals are:

- A perfect [PageSpeed Insights](https://pagespeed.web.dev/) score.
- Fully valid HTML, as measured by
  [W3C's Markup Validation Service](https://validator.w3.org/).

For the developer, the codebase should minimize the steps and amount of time
required to get up and running. From there, customization and extension of the
web app should be simple. The characteristics of a well-written codebase also
apply, such as:

- Easy to understand
- Modular functionality
- Clearly defined behavior with validation through tests

## Community and Resources

Join
[the `#saaskit` channel in Deno's Discord](https://discord.com/channels/684898665143206084/1085986084653109438)
to meet other SaaSKit developers, ask questions, and get unblocked.

Here's a list of articles, how to guides, and videos about SaaSKit:

- [Announcing Deno SaaSKit](https://deno.com/blog/announcing-deno-saaskit)
- [Getting Started with SaaSKit (video walkthrough)](https://www.youtube.com/watch?v=1GYs3NbVCfE)

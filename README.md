# Deno SaaSKit

> Warning: this project is in beta. Design, workflows and user accounts are
> subject to change.

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
[our roadmap](https://github.com/denoland/saaskit/issues/60).

## Getting Started with Local Development

1. [Install Docker](https://docs.docker.com/engine/install/) and the
   [Supabase CLI](https://supabase.com/docs/guides/cli).
1. Copy
1. While Docker is running, initialize Supabase services by running
   `supabase start`.

## Getting Started with Production

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

## Related

- [Official announcement blog post](https://deno.com/blog/announcing-deno-saaskit).

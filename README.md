# SaaSkit

[SaaSkit](https://deno.com/saaskit) is an open sourced, highly performant
template for building your SaaS quickly and easily. SaaSkit ships with these
foundational features that every SaaS needs:

- User accounts
- User creation flows
- Landing page
- Pricing page
- Signin and session management
- Billing integration via Stripe
- Gated API endpoints

SaaSkit is built on [Fresh](https://fresh.deno.dev) and
[Deno](https://deno.land), which means you get these awesome technical features:

- Native TypeScript support
- no build step
- server-side rendering and islands architecture
- built-in robust tooling, such as a
  [formatter](https://deno.land/manual/tools/formatter),
  [linter](https://deno.land/manual/tools/linter), and
  [test runner](https://deno.land/manual/basics/testing)
- npm specifiers

Join [our Discord](https://discord.gg/deno) to ask questions, learn how to
contribute, and meet other developers using SaaSkit.

Have feedback? Let us know in
[the issues](https://github.com/denoland/saaskit/issues).

Want to know where SaaSkit is headed? Check out [our public roadmap]().

## Installation

Start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.

### Setup Environmental Variables

Copy Supabase and Stripe credentials to `.env` same as `.example.env`.

### Setup Supabase

SaaSkit currently uses Supabase for data storage and authentication.

1. Create the `todos` table:

- Go to `Databases` > `Tables`
- Click `New Table`
- Enter the name as `todos` and check `Enable Row Level Security (RLS)`
- Configure the following columns:

| Name      | Type   | Default value | Primary |
| --------- | ------ | ------------- | ------- |
| `id`      | `int8` | --            | `true`  |
| `name`    | `text` | (empty)       | `false` |
| `user_id` | `uuid` | `uid()`       | `false` |

2. Setup authentication:

- Go to `Authentication` > `Providers` > `Email`
- Disable `Confirm email`
- Go to `Authentication` > `Policies`
- Click `New Policy` and then `Create a policy from scratch`
- Enter the policy name as `Enable all operations for users based on user_id`
- Enter the `USING expression` as `(uid() = user_id)`

### Setup Stripe

SaaSkit uses Stripe for subscription billing.

1. Set your custom branding in the
   [settings](https://dashboard.stripe.com/settings/branding)
2. Configure the Customer Portal
   [settings](https://dashboard.stripe.com/test/settings/billing/portal)
3. Toggle on "Allow customers to update their payment methods"
4. Toggle on "Allow customers to update subscriptions"
5. Toggle on "Allow customers to cancel subscriptions"
6. Add the products and prices that you want
7. Set up the required business information and links

## Hosting

You can deploy your SaaSkit project to any VPS or Deno Deploy.

### Deno Deploy

TODO.

## Building a Modern SaaS Business

TODO.

## About Fresh and Deno

[Deno](https://deno.land) is the easiest, and most secure JavaScript/TypeScript
runtime. It comes with a [robust toolchain](https://deno.land/manual/tools) and
native TypeScript support so you can skip configuration and dive right into
coding.

[Fresh](https://fresh.deno.dev) is a next-gen web framework built for speed,
reliability, and simplicity. Fresh uses server-side rendering, islands, and
progressive enhancement, and sends zero JavaScript to the client by default.

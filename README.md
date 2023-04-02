# Deno SaaSKit

> Warning: this project is in beta. Design, workflows and user accounts are
> subject to change.

[Deno SaaSKit](https://deno.com/saaskit) is an open-sourced, highly performant
template for building your SaaS quickly and easily. This template ships with
these foundational features that every SaaS needs:

- User accounts
- User creation flows
- Landing page
- Pricing section
- Sign-in and session management
- Billing integration via Stripe
- Gated API endpoints

Deno SaaSKit is built on [Fresh](https://fresh.deno.dev) and
[Deno](https://deno.land), which means you get these awesome technical features:

- Native TypeScript support
- No build step
- Server-side rendering and islands architecture
- Built-in robust tooling, such as a
  [formatter](https://deno.land/manual/tools/formatter),
  [linter](https://deno.land/manual/tools/linter), and
  [test runner](https://deno.land/manual/basics/testing)
- npm specifiers

Join [our Discord](https://discord.gg/deno) to ask questions, learn how to
contribute, and meet other developers using Deno SaaSKit.

Have feedback? Let us know in
[the issues](https://github.com/denoland/saaskit/issues).

Want to know where Deno SaaSKit is headed? Check out
[our public roadmap](https://github.com/orgs/denoland/projects/35).

Read more about Deno SaaSkit from
[our announcement blog post](https://deno.com/blog/announcing-deno-saaskit).

## Installation

Getting started with Deno SaaSKit is straightforward.

### Create `.env` file

You can copy the `.example.env` into `.env`

```bash
cp .example.env .env
```

The only variables you need are:

- `SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Continue below to learn where to grab these keys.

### Setup Supabase

This project uses [Supabase](https://supabase.com) for handling authentication
strategies, as well as data storage for the product itself, which is a simple
To-Do list app.

You can get started with Supabase in local development mode using the
[Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npx supabase start
```

Once ready, you can create a Supabase account and then
[create a new Supabase project](https://app.supabase.com/projects).

Once your project is created, you can grab your `SUPABASE_URL` and
`SUPABASE_ANON_KEY` from
[Settings > API](https://app.supabase.com/project/_/settings/api).

### Create a `todos` table

Deno SaaSKit defaults to a simple To-Do list app to illustrate how authenticated
API routes can be created. Of course, you can choose to build whatever app you'd
like.

But to get this Deno SaaSKit template to work, we'll create a `todos` table in
the [Supabase Dashboard](http://localhost:54323/project/default/editor).

- Go to `Databases` > `Tables`
- Click `New Table`
- Enter the name as `todos` and check `Enable Row Level Security (RLS)`
- Configure the following columns:

| Name      | Type   | Default value        | Primary |
| --------- | ------ | -------------------- | ------- |
| `id`      | `uuid` | `uuid_generate_v4()` | `true`  |
| `name`    | `text` | `NULL`               | `false` |
| `user_id` | `uuid` | `auth.uid()`         | `false` |

We want the `user_id` column to link back to our Supabase Auth users, this is
what allows us to write security policies to restrict access to the data based
on the authenticated user. To set up this reference, click the link symbol next
to the `user_id` column name, select schema `auth`, table `users`, and column
`id`. Now the `user_id` will link back to a user object in Supabase Auth.

You can also keep the column `created_at` if you'd like.

Hit save and then your table should be created.

### Create a `customers` table

- Go to `Database` > `Tables`
- Click `New Table`
- Enter the name as `customers` and check `Enable Row Level Security (RLS)`
- Configure the following columns:

| Name                 | Type   | Default value | Primary |
| -------------------- | ------ | ------------- | ------- |
| `user_id`            | `uuid` | `auth.uid()`  | `true`  |
| `stripe_customer_id` | `text` | `NULL`        | `false` |
| `is_subscribed`      | `bool` | `false`       | `false` |

- Click the link symbol next to the `user_id` column name, select schema `auth`,
  table `users`, and column `id`. Now the `user_id` will link back to a user
  object in Supabase Auth.

### Automate Stripe subscription updates via Supabase

In Stripe, register a webhook endpoint by following
[this guide](https://stripe.com/docs/development/dashboard/register-webhook)
with the following values:

- Endpoint URL = `https://<SITE HOSTNAME>/api/subscription`
- Listen to `Events on your account`
- Select events to listen to:
  - `customer.subscription.created`
  - `customer.subscription.deleted`

### Setup authentication

[Supabase Auth](https://supabase.com/docs/guides/auth/overview) makes it simple
to authenticate and authorize users through a variety of authentication
strategies.

Deno SaaSKit currently supports email, but we plan to add more strategies going
forward.

To setup Supabase Auth:

- Go to `Authentication` > `Providers` > `Email`
- Disable `Confirm email`
- Back on the left-hand bar, under `Configuration`, click on `Policies`
- Click `New Policy` on the `customers` table pane and then
  `Create a policy from scratch`
- Enter the policy name as `Enable all operations for users based on user_id`
- For `Allowed operation`, select `All`
- For `Target Roles` select `authenticated`
- Enter the `USING expression` as `(auth.uid() = user_id)`
- Enter the `WITH CHECK expression` as `(auth.uid() = user_id)`
- Click `Review` then `Save policy`
- Repeat for the `todos` table pane

These steps enable using email with Supabase Auth and provide a simple
authentication strategy restricting each user to only create, read, update, and
delete their own data.

### Setup Stripe

Currently, Deno SaaSKit uses [Stripe](https://stripe.com) for subscription
billing. In the future, we are open to adding other payment processors.

To set up Stripe:

- Create a Stripe account
- Since upgrading to a paid tier will take you directly to Stripe's domain, we
  recommend
  [setting up your branding on Stripe](https://dashboard.stripe.com/settings/branding)
- Configure
  [the Customer Portal settings](https://dashboard.stripe.com/test/settings/billing/portal).
  This is what your users will see when they add a credit card and upgrade.
- Toggle on "Allow customers to update their payment methods"
- Toggle on "Allow customers to update subscriptions"
- Toggle on "Allow customers to cancel subscriptions"
- Add relevant [products and prices](https://dashboard.stripe.com/test/products)
- Set up the required business information and links
  [in your settings](https://dashboard.stripe.com/settings)
- Grab the `STRIPE_SECRET_KEY`, which is the secret key located at
  [Developers > API Keys](https://dashboard.stripe.com/test/apikeys)

Once you have all of this setup, you should be able to run Deno SaaSKit locally.

### Running locally

You can start the project by running: And go to `localhost:8000`` on your
browser.

## Customizing Deno SaaSKit

This is a template to help you get started. Here is how you can tweak and update
for your SaaS.

### Update `constants.ts`

Feel free to update `constants.ts` with information that is relevant to your
SaaS.

```
export const SITE_NAME = "Your SaaS";
export const SITE_DESCRIPTION = "Some details about your SaaS.";
export const AUTHENTICATED_REDIRECT_PATH = "/dashboard";
export const STRIPE_PREMIUM_PLAN_PRICE_ID = "price_1MPiEkD6QJts4RaYcp1SevPe";
export const FREE_PLAN_TODOS_LIMIT = 5;
```

The Stripe premium plan price id is the "API ID" of your Stripe product. If you
do not set it to your own premium plan price id, Stripe will not be able to find
the set product plan when it tries to upgrade the subscription from the
account's subscription settings. So make sure you set
`STRIPE_PREMIUM_PLAN_PRICE_ID` to the value found on the
[products page](https://dashboard.stripe.com/test/products) on Stripe using the
`API-ID`.

### Landing Page

The main landing page can be found at `/routes/index.tsx` and is composed of TSX
components.

### Login and Logout

All of the authentication logic is handled by Supabase Auth. All of the logic
can be found in these locations:

- `/routes/api/*`: All login and logout API functionalities are located here
- `/routes/signup.tsx`, `/routes/login.tsx`, `/routes/logout.ts`: The pages that
  visitors see when signing up or logging in (logout.ts redirects the user to
  `/`)
- `/utils/supabase.ts`: A wrapper function around Supabase client.

### Dashboard

This template comes with a simple To-Do checklist app. All of the logic for that
can be found:

- `/routes/dashboard/api/todo.ts`: the API route to handle creating and deleting
  a "todo"
- `/routes/dashboard/todos.tsx`: the actual To Dos page
- `/islands/TodoList.tsx`: an island that offers interactivity when creating and
  deleting "todo"s, as well as with various helper functions for interfacing
  with `/dashboard/api/todo`
- `/utils/todos.ts`: a set of helper functions to provide CRUD operations with
  Supabase's database

### Billing

Billing is currently managed via Stripe. Here are locations where you can update
Stripe logic:

- `/utils/stripe.ts`: This helper function exports a Stripe client using the
  `STRIPE_SECRET_KEY`
- `/routes/dashboard/manage-subscription.ts`: This API endpoint redirects the
  user to their subscription page on Stripe's domain via Stripe's client
- `/routes/dashboard/upgrade-subscription.ts`: This API endpoint redirects the
  user to a page that shows an upgraded subscription tier based on
  `STRIPE_PREMIUM_PLAN_PRICE_ID`

### Blog

SaaSKit also provides a markdown based blog. There are three main directories to
manage the blog. First, in `routes/blog` you will find the routes needed to
serve the `/blog` page and the routes to your posts. These will be available at
`/blog/<slug>`. The name of the slug will be taken from the file name. Speaking
of posts and their filenames. These are located in `data/posts`. To add a new
blog post, simply create a new markdown file in this directory. The following
front matter attributes are supported out of the box

- title (required)
- published_at (optional) in `YYYY-MM-DD` format
- summary (optional)

The third important file/directory is located in `utils/posts.ts`. There you
will find the functions used to retrieve the data to create the post pages. The
SaaSKit blog uses the styles provided by [gfm](https://deno.land/x/gfm@0.2.1).

The blog is based on the instructions in the blog post
[Building a Blog with Fresh](https://deno.com/blog/build-a-blog-with-fresh). For
more information about how the blog works, see the reference post.

## Hosting

You can deploy your Deno SaaSKit project to any VPS or Deno Deploy.

### Deno Deploy

TODO.

### Theme Customization

You can customize theme options such as spacing, color, etc. By default, Deno
SaaSKit comes with `primary` and `secondary` colors predefined within
`twind.config.ts`. Change these values to match your desired color scheme.

## Contributing

When submitting a pull request, please:

1. Follow the
   [Deno Style Guide](https://deno.land/manual/references/contributing/style_guide).
1. Include tests for any added functionality.
1. Ensure `deno task test` passes successfully.

## Building a Modern SaaS Stack

Along with this template, we are creating a series of How To guides to show how
to build a modern SaaS stack using Deno SaaSKit and Fresh. This series will
cover:

- How to setup login logout in Fresh
- How to setup user accounts with Supabase in Fresh
- How to setup Stripe subscriptions in Fresh
- How to create authenticated API routes in Fresh
- How to deploy Deno SaaSKit to any Virtual Private Server with Docker

And more! We'll update all relevant links to point to written and video
tutorials when they're released.

If you have a specific topic that you'd like us to cover, please let us know in
[Discord](https://discord.gg/deno).

## About Fresh and Deno

[Deno](https://deno.land) is the easiest, and most secure JavaScript/TypeScript
runtime. It comes with a [robust toolchain](https://deno.land/manual/tools) and
native TypeScript support so you can skip configuration and dive right into
coding.

[Fresh](https://fresh.deno.dev) is a next-gen web framework built for speed,
reliability, and simplicity. Fresh uses server-side rendering, islands, and
progressive enhancement, and sends zero JavaScript to the client by default.

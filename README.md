# Deno SaaSKit

[![Discord Chat](https://img.shields.io/discord/684898665143206084?logo=discord&style=social)](https://discord.gg/deno)
[![CI](https://github.com/denoland/saaskit/actions/workflows/ci.yml/badge.svg)](https://github.com/denoland/saaskit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/denoland/saaskit/branch/main/graph/badge.svg?token=77F8TYTP13)](https://codecov.io/gh/denoland/saaskit)

[Deno SaaSKit](https://deno.com/saaskit) is an open-sourced, highly performant
template for building your SaaS quickly and easily.

> Note: this project is in beta. Design, workflows, and user accounts are
> subject to change.

## Features

- Deno's built-in [formatter](https://deno.land/manual/tools/formatter),
  [linter](https://deno.land/manual/tools/linter) and
  [test runner](https://deno.land/manual/basics/testing) and TypeScript support
- Next-gen web framework with [Fresh](https://fresh.deno.dev/)
- In-built data persistence with [Deno KV](https://deno.com/kv)
- High-level OAuth with [Deno KV OAuth](https://deno.land/x/deno_kv_oauth)
- Modern CSS framework with [Tailwind CSS](https://tailwindcss.com/)
- Responsive, SaaS-oriented design
- Dashboard with users view and statistics chart
- Stripe integration (optional)
- First-class web performance
- [REST API](#rest-api-reference)
- Blog with RSS feed and social sharing icons
- HTTP security headers

## Get Started

### Get Started Locally

Before starting, you'll need:

- A GitHub account
- The [Deno CLI](https://deno.com/manual/getting_started/installation) and
  [Git](https://github.com/git-guides/install-git) installed on your machine

To get started:

1. Clone this repo:
   ```bash
   git clone https://github.com/denoland/saaskit.git
   cd saaskit
   ```
1. Create a new `.env` file.
1. Navigate to GitHub's
   [**New OAuth Application** page](https://github.com/settings/applications/new).
1. Set **Application name** to your desired application name. E.g. `ACME, Inc`.
1. Set **Homepage URL** to `http://localhost:8000`.
1. Set **Authorization callback URL** to `http://localhost:8000/callback`.
1. Click **Register application**.
1. Copy the **Client ID** value to the `.env` file:
   ```bash
   GITHUB_CLIENT_ID=<GitHub OAuth application client ID>
   ```
1. On the same web page, click **Generate a new client secret**.
1. Copy the **Client secret** value to the `.env` file on a new line:
   ```bash
   GITHUB_CLIENT_SECRET=<GitHub OAuth application client secret>
   ```
1. Start the server:
   ```bash
   deno task start
   ```
1. Navigate to `http://localhost:8000` to start playing with your new SaaS app.

### Set Up Stripe (Optional)

This guide will enable test Stripe payments, the pricing page, and "Premium
user" functionality.

Before starting, you'll need:

- A [Stripe](https://stripe.com) account
- The [Stripe CLI](https://stripe.com/docs/stripe-cli#install) installed and
  signed-in on your machine

To get started:

1. Navigate to the
   [**API keys** page](https://dashboard.stripe.com/test/apikeys) on the
   **Developers** dashboard.
1. In the **Standard keys** section, click **Reveal test key** on the **Secret
   key** table row.
1. Click to copy the value and paste to the `.env` file:
   ```bash
   STRIPE_SECRET_KEY=<Stripe secret key>
   ```
1. Run the Stripe initialization script:
   ```bash
   deno task init:stripe
   ```
1. Copy the Stripe "Premium Plan" price ID to the `.env` file:
   ```bash
   STRIPE_PREMIUM_PLAN_PRICE_ID=<Stripe "Premium Plan" price ID>
   ```
1. Begin
   [listening locally to Stripe events](https://stripe.com/docs/cli/listen):
   ```bash
   stripe listen --forward-to localhost:8000/api/stripe-webhooks --events=customer.subscription.created,customer.subscription.deleted
   ```
1. Copy the **webhook signing secret** to the `.env` file:
   ```bash
   STRIPE_WEBHOOK_SECRET=<Stripe webhook signing secret>
   ```
1. Start the server:
   ```bash
   deno task start
   ```
1. Navigate to `http://localhost:8000` to start playing with your new SaaS app
   with Stripe enabled.

> Note: You can use
> [Stripe's test credit cards](https://stripe.com/docs/testing) to make test
> payments while in Stripe's test mode.

### Bootstrap the Database (Optional)

Use the following commands to work with your local Deno KV database:

- `deno task db:seed` - Populate the database with data from the
  [Hacker News API](https://github.com/HackerNews/API).
- `deno task db:dump > backup.json` - Write all database entries to
  `backup.json`.
- `deno task db:restore backup.json` - Restore the database from `backup.json`.
- `deno task db:reset` - Reset the database. This is not recoverable.

## Customize and Extend

### Global Constants

The [utils/constants.ts](utils/constants.ts) file includes global values used
across various aspects of the codebase. Update these values according to your
needs.

### Create a Blog Post

1. Create a `.md` file in the [/posts](/posts) with the filename as the slug of
   the blog post URL. E.g. a file with path `/posts/hello-there.md` will have
   path `/blog/hello-there`.
1. Write the
   [Front Matter](https://daily-dev-tips.com/posts/what-exactly-is-frontmatter/)
   then [Markdown](https://www.markdownguide.org/cheat-sheet/) text to define
   the properties and content of the blog post.

   ````md
   ---
   title: This is my first blog post!
   publishedAt: 2022-11-04T15:00:00.000Z
   summary: This is an excerpt of my first blog post.
   ---

   # Heading 1

   Hello, world!

   ```javascript
   console.log("Hello World");
   ```
   ````
1. Start the server:
   ```bash
   deno task start
   ```
1. Navigate to the URL of the newly created blog post. E.g.
   `http://localhost:8000/blog/hello-there`.

See other examples of blog post files in [/posts](/posts).

### Themes

You can customize theme options such as spacing, color, etc. By default, Deno
SaaSKit comes with `primary` and `secondary` colors predefined within
`tailwind.config.ts`. Change these values to match your desired color scheme.

### Cover Image

To replace the cover image, replace the [/static/cover.png](/static/cover.png)
file. If you'd like to change the filename, also be sure to change the
`imageUrl` property in the [`<Head />`](/components/Head.tsx) component.

## Deploy to Production

This section assumes that a
[local development environment](#getting-started-locally) is already set up.

1. Navigate to your
   [GitHub OAuth application settings page](https://github.com/settings/developers).
1. Set the **Homepage URL** to your production URL. E.g.
   `https://hunt.deno.land`.
1. Set the **Authorization callback URL** to your production URL with the
   `/callback` path. E.g. `https://hunt.deno.land/callback`.
1. Copy all the environment variables in your `.env` file to your production
   environment.

### Deploy to [Deno Deploy](https://deno.com/deploy)

1. Clone this repository for your SaaSKit project.
1. Sign into [Deno Deploy](https://dash.deno.com) with your GitHub account.
1. Select your GitHub organization or user, repository, and branch.
1. Select **Automatic** deployment mode and `main.ts` as the entry point.
1. Click **Link**, which will start the deployment.
1. Once the deployment is complete, click on **Settings** and add the production
   environmental variables, then hit **Save**.

You should now be able to visit your newly deployed SaaS.

### Deploy to any VPS with Docker

[Docker](https://docker.com) makes it easy to deploy and run your Deno app to
any virtual private server (VPS). This section will show you how to do that with
AWS Lightsail and Digital Ocean.

1. [Install Docker](https://docker.com) on your machine, which should also
   install
   [the `docker` CLI](https://docs.docker.com/engine/reference/commandline/cli/).
1. Create an account on [Docker Hub](https://hub.docker.com), a registry for
   Docker container images.

> Note: the [`Dockerfile`](./Dockerfile), [`.dockerignore`](./.dockerignore) and
> [`docker-compose.yml`](./docker-compose.yml) files come included with this
> repo.

1. Grab the SHA1 commit hash by running the following command in the repo's root
   folder:

```sh
# get the SHA1 commit hash of the current branch
git rev-parse HEAD
```

1. Copy the output of the above and paste it as `DENO_DEPLOYMENT_ID` in your
   .env file. This value is needed to enable caching on Fresh in a Docker
   deployment.

1. Finally, refer to these guides for using Docker to deploy Deno to specific
   platforms:

- [Amazon Lightsail](https://deno.land/manual/advanced/deploying_deno/aws_lightsail)
- [Digital Ocean](https://deno.land/manual/advanced/deploying_deno/digital_ocean)
- [Google Cloud Run](https://deno.land/manual/advanced/deploying_deno/google_cloud_run)

### Set Up Stripe for Production (Optional)

1. [Activate your Stripe account](https://stripe.com/docs/account/activate).
1. Navigate to the
   [**API keys** page](https://dashboard.stripe.com/test/apikeys) on the
   **Developers** dashboard.
1. In the **Standard keys** section, click **Reveal test key** on the **Secret
   key** table row.
1. Click to copy the value and paste to your `STRIPE_SECRET_KEY` environment
   variable in your production environment.
   ```bash
   STRIPE_SECRET_KEY=<Stripe secret key>
   ```
1. Navigate to the [**Webhooks** page](https://dashboard.stripe.com/webhooks) to
   register your webhook endpoint.
1. Click **Add endpoint**.
1. Set **Endpoint URL** to your production URL with the `/api/stripe-webhooks`
   path. E.g. `https://hunt.deno.land/api/stripe-webhooks`.
1. Set **Listen to** to `Events on your account`.
1. Set `customer.subscription.created` and `customer.subscription.deleted` as
   events to listen to.
1. Click **Add endpoint**.
1. Optionally,
   [set up your Stripe branding](https://dashboard.stripe.com/settings/branding)
   to customize the look and feel of your Stripe checkout page.

## REST API Reference

### `GET /api/items`

Get all items in chronological order. Add `?cursor=<cursor>` URL parameter for
pagination. Limited to 10 items per page.

Example 1:

```jsonc
// https://hunt.deno.land/api/items
{
  "values": [
    {
      "id": "01HAY7A4ZD737BHJKXW20H59NH",
      "userLogin": "Deniswarui4",
      "title": "czxdczs",
      "url": "https://wamufx.co.ke/",
      "score": 0
    },
    {
      "id": "01HAD9KYMCC5RS2FNPQBMYFRSK",
      "userLogin": "jlucaso1",
      "title": "Ok",
      "url": "https://github.com/jlucaso1/crunchyroll-quasar",
      "score": 0
    },
    {
      "id": "01HA7YJJ2T66MSEP78NAG8910A",
      "userLogin": "BrunoBernardino",
      "title": "LockDB: Handle process/event locking",
      "url": "https://lockdb.com",
      "score": 2
    }
    // 7 more items...
  ],
  "cursor": "AjAxSDdUNTBBUkY0QzhEUjRXWjkyVDJZSFhZAA=="
}
```

Example 2 (using `cursor` field from page 1):

```jsonc
// https://hunt.deno.land/api/items?cursor=AjAxSDdUNTBBUkY0QzhEUjRXWjkyVDJZSFhZAA==
{
  "values": [
    {
      "id": "01H777YG17VY8HANDHE84ZXKGW",
      "userLogin": "BrunoBernardino",
      "url": "https://asksoph.com",
      "title": "Ask Soph about a dead philosopher",
      "score": 2
    },
    {
      "id": "01H6RG2V3AV82FJA2VY6NJD9EP",
      "userLogin": "retraigo",
      "url": "https://github.com/retraigo/appraisal",
      "title": "Appraisal: Feature Extraction, Feature Conversion in TypeScript",
      "score": 0
    },
    {
      "id": "01H64TZ3TNKFWS35MJ9PSGNWE1",
      "userLogin": "lambtron",
      "url": "https://www.zaynetro.com/post/2023-how-deno-works",
      "title": "How Deno works (blog post)",
      "score": 2
    }
    // 7 more items...
  ],
  "cursor": "AjAxSDJUSlBYWUJRM1g0OEo2UlIzSFgyQUQ0AA=="
}
```

### `GET /api/items/:id`

Get the item with the given ID.

Example:

```jsonc
// https://hunt.deno.land/api/items/01H5379J1VZ7EB54KSCSQSCRJC
{
  "id": "01H5379J1VZ7EB54KSCSQSCRJC",
  "userLogin": "lambtron",
  "url": "https://github.com/Savory/saaskit-danet",
  "title": "saaskit-danet: a modern SaaS template built for Fresh for SSR and Danet for the API",
  "score": 10
}
```

### `GET /api/users`

Get all users in alphabetical order by GitHub login. Add `?cursor=<cursor>` URL
parameter for pagination. Limited to 10 users per page.

Example 1:

```jsonc
// https://hunt.deno.land/api/users
{
  "values": [
    {
      "login": "51chengxu",
      "sessionId": "9a6745a1-3a46-45c8-a265-c7469ff73678",
      "isSubscribed": false,
      "stripeCustomerId": "cus_OgWU0R42bolJtm"
    },
    {
      "login": "AiridasSal",
      "sessionId": "adb25cac-9be7-494f-864b-8f05b80f7168",
      "isSubscribed": false,
      "stripeCustomerId": "cus_OcJW6TadIjjjT5"
    },
    {
      "login": "ArkhamCookie",
      "stripeCustomerId": "cus_ObVcWCSYwYOnWS",
      "sessionId": "fd8e7aec-2701-44ae-925b-25e17ff288c4",
      "isSubscribed": false
    }
    // 7 more users...
  ],
  "cursor": "AkVob3ItZGV2ZWxvcGVyAA=="
}
```

Example 2 (using `cursor` field from page 1):

```jsonc
// https://hunt.deno.land/api/users?cursor=AkVob3ItZGV2ZWxvcGVyAA==
{
  "values": [
    {
      "login": "EthanThatOneKid",
      "sessionId": "ae7425c1-7932-412a-9956-e456787d557f",
      "isSubscribed": false,
      "stripeCustomerId": "cus_OeYA2oTJRlZBIA"
    },
    {
      "login": "Fleury99",
      "sessionId": "2e4920a3-f386-43e1-8c0d-61b5e0edfc0d",
      "isSubscribed": false,
      "stripeCustomerId": "cus_OcOUJAYmyxZlDR"
    },
    {
      "login": "FriendlyUser",
      "stripeCustomerId": "cus_ObLbqu5gxp0qnl",
      "sessionId": "508ff291-7d1c-4a67-b19f-447ad73b5914",
      "isSubscribed": false
    }
    // 7 more users...
  ],
  "cursor": "Ak5ld1lhbmtvAA=="
}
```

### `GET /api/users/:login`

Get the user with the given GitHub login.

Example:

```jsonc
// https://hunt.deno.land/api/users/hashrock
{
  "login": "hashrock",
  "stripeCustomerId": "cus_ObqbLXkRtsKy70",
  "sessionId": "97eec97a-6636-485e-9b14-253bfa3ce1de",
  "isSubscribed": true
}
```

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

Join [the `#saaskit` channel in Deno's Discord](https://discord.gg/deno) to meet
other SaaSKit developers, ask questions, and get unblocked.

Here's a list of articles, how to guides, and videos about SaaSKit:

- [Announcing Deno SaaSKit](https://deno.com/blog/announcing-deno-saaskit)
- [Getting Started with SaaSKit (video walkthrough)](https://www.youtube.com/watch?v=1GYs3NbVCfE)

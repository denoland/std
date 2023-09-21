# Deno SaaSKit

[![Discord Chat](https://img.shields.io/discord/684898665143206084?logo=discord&style=social)](https://discord.gg/deno)
[![CI](https://github.com/denoland/saaskit/actions/workflows/ci.yml/badge.svg)](https://github.com/denoland/saaskit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/denoland/saaskit/branch/main/graph/badge.svg?token=77F8TYTP13)](https://codecov.io/gh/denoland/saaskit)

[Deno SaaSKit](https://deno.com/saaskit) is an open-sourced, highly performant
template for building your SaaS quickly and easily.

> Note: this project is in beta. Design, workflows, and user accounts are
> subject to change.

## Features

- [No build step](https://deno.com/blog/you-dont-need-a-build-step#non-building-with-deno-and-fresh)
- Deno's built-in [formatter](https://deno.land/manual/tools/formatter),
  [linter](https://deno.land/manual/tools/linter) and
  [test runner](https://deno.land/manual/basics/testing) and TypeScript support.
- Database management and user authentication with
  [Deno KV](https://deno.com/manual/runtime/kv), which provides zero config
  durable data storage. _Prefer using Supabase for data storage?
  [Check out this version of SaaSKit](https://github.com/denoland/saaskit/tree/3b1b14a97eef8859596015b22557d575d3b63c09)._
- Billing management with [Stripe](https://stripe.com/).
- [Fresh](https://fresh.deno.dev/) as the web framework and
  [Tailwind CSS](https://tailwindcss.com/) as the CSS framework.

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
   ```
   GITHUB_CLIENT_ID=<GitHub OAuth application client ID>
   ```
1. On the same web page, click **Generate a new client secret**.
1. Copy the **Client secret** value to the `.env` file on a new line:
   ```
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
   ```
   STRIPE_SECRET_KEY=<Stripe secret key>
   ```
1. Run the Stripe initialization script:
   ```bash
   deno task init:stripe
   ```
1. Copy the Stripe "Premium Plan" price ID to the `.env` file:
   ```
   STRIPE_PREMIUM_PLAN_PRICE_ID=<Stripe "Premium Plan" price ID>
   ```
1. Begin
   [listening locally to Stripe events](https://stripe.com/docs/cli/listen):
   ```
   stripe listen --forward-to localhost:8000/api/stripe-webhooks --events=customer.subscription.created,customer.subscription.deleted
   ```
1. Copy the **webhook signing secret** to the `.env` file:
   ```
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
   ```
   deno task start
   ```
1. Navigate to the URL of the newly created blog post. E.g.
   `http://localhost:8000/blog/hello-there`.

See other examples of blog post files in [/posts](/posts).

### Themes

You can customize theme options such as spacing, color, etc. By default, Deno
SaaSKit comes with `primary` and `secondary` colors predefined within
`twind.config.ts`. Change these values to match your desired color scheme.

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

The values of the environmental variables are pulled from the `.env` file.

The `DENO_DEPLOYMENT_ID` variable is needed for Docker deployment of a Deno
Fresh app for caching to work properly. Its value needs to be a unique id tied
to the deployment. We recommend using the SHA1 commit hash, which can be
obtained from the following command run in the repo's root folder:

```sh
# get the SHA1 commit hash of the current branch
git rev-parse HEAD
```

Then, copy the output of the above and paste it as `DENO_DEPLOYMENT_ID` in your
.env file.

Finally, refer to these guides for using Docker to deploy Deno to specific
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
   ```
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

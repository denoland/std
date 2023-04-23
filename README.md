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

```bash
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
stripe listen --forward-to localhost:8000/api/stripe-webhooks
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

## Customization

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

## Deploying to Production

This section assumes that a
[local development environment](#getting-started-locally) has been set up.

### Database (Supabase)

In order to setup Supabase for production, you'll have to create two tables:

- `todos`
- `customers`

#### Setup the `todos` table

- Go to `Databases` > `Table Editor`
- Click `New Table`
- Enter the name as `todos` and check `Enable Row Level Security (RLS)`
- Configure the following columns:

| Name      | Type   | Default value        | Primary |
| --------- | ------ | -------------------- | ------- |
| `id`      | `uuid` | `uuid_generate_v4()` | `true`  |
| `name`    | `text` | `NULL`               | `false` |
| `user_id` | `uuid` | `auth.uid()`         | `false` |

- Click the link symbol next to the `user_id` column name. Then, select schema
  `auth`, table `users`, and column `id`. Now the `user_id` will link back to a
  user object in Supabase Auth.

#### Setup the `customers` table

- Go to `Database` > `Tables`
- Click `New Table`
- Enter the name as `customers` and check `Enable Row Level Security (RLS)`
- Configure the following columns:

| Name                 | Type   | Default value | Primary |
| -------------------- | ------ | ------------- | ------- |
| `user_id`            | `uuid` | `auth.uid()`  | `true`  |
| `stripe_customer_id` | `text` | `NULL`        | `false` |
| `is_subscribed`      | `bool` | `false`       | `false` |

- Click the link symbol next to the `user_id` column name. Then, select schema
  `auth`, table `users`, and column `id`. Now the `user_id` will link back to a
  user object in Supabase Auth.

### Authentication (Supabase)

In your [Supabase dashboard](https://app.supabase.com/projects):

1. Go to your project
2. Go to `Authentication` > `Providers` > click `Email`
3. Disable `Confirm email`
4. Back on the left-hand bar, click on `Policies`
5. Click `New Policy` on the `customers` table pane and then
   `Create a policy from scratch`
6. Enter the policy name as `Enable all operations for users based on user_id`
7. For `Allowed operation`, select `All`
8. For `Target Roles` select `authenticated`
9. Enter the `USING expression` as `(auth.uid() = user_id)`
10. Enter the `WITH CHECK expression` as `(auth.uid() = user_id)`
11. Click `Review` then `Save policy`
12. Repeat steps 5 to 11 for the `todos` table pane

These steps enable using email with Supabase Auth and provide a simple
authentication strategy restricting each user to only create, read, update, and
delete their own data.

### Payments (Stripe)

In order to use Stripe in production, you'll have to
[activate your Stripe account](https://stripe.com/docs/account/activate).

Once your Stripe account is activated, simply grab the production version of the
Stripe Secret Key. That will be the value of `STRIPE_SECRET_KEY` in prod.

#### Automate Stripe Subscription Updates via Webhooks

Keep your `customers` database up to date with billing changes by
[registering a webhook endpoint in Stripe](https://stripe.com/docs/development/dashboard/register-webhook).

- Endpoint URL: `https://{{ YOUR DOMAIN }}/api/stripe-webhooks`
- Listen to `Events on your account`
- Select `customer.subscription.created` and `customer.subscription.deleted`

#### Customer Portal Branding

[Set up your branding on Stripe](https://dashboard.stripe.com/settings/branding),
as the user will be taken to Stripe's checkout page when they upgrade.

### Deployment Options

#### Deno Deploy

These steps show you how to deploy your SaaS app close to your users at the edge
with [Deno Deploy](https://deno.com/deploy).

1. Clone this repository for your SaaSKit project.

2. Sign into [Deno Deploy](https://dash.deno.com) with your GitHub account.

3. Select your GitHub organization or user, repository, and branch

4. Select "Automatic" deployment mode and `main.ts` as the entry point

5. Click "Link", which will start the deployment.

6. Once the deployment is complete, click on "Settings" and add the production
   environmental variables, then hit "Save"

You should be able to visit your newly deployed SaaS.

#### Deno Deploy via GitHub Action

You can also choose to deploy to
[Deno Deploy via a GitHub Action](https://github.com/denoland/deployctl/blob/main/action/README.md),
which offers more flexibility. For instance, with the GitHub Action, you could:

- Add a build step
- Run `deno lint` to lint your code
- Run `deno test` to run automated unit tests

1. Create
   [a new, empty project from the Deno Deploy dashboard](https://dash.deno.com/new).
   Set a name for your project.

2. Add the GitHub Action.

[GitHub Actions](https://docs.github.com/en/actions) are configured using a
`.yml` file placed in the `.github/workflows` folder of your repo. Here's an
example `.yml` file to deploy to Deno Deploy. Be sure to update the
`YOUR_DENO_DEPLOY_PROJECT_NAME` with one that you've set in Deno Deploy.

```yml
# Deploy this project to Deno Deploy
name: Deploy
on: [push]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # Needed for auth with Deno Deploy
      contents: read  # Needed to clone the repository

    steps:
      - name: Clone repository
        uses: actions/checkout@v3

      - name: Install Deno
        uses: denoland/setup-deno@main
        # If you need to install a specific Deno version	
        # with:
        #   deno-version: 1.32.4

## You would put your building, linting, testing and other CI/CD steps here

## FInally, deploy 
      - name: Upload to Deno Deploy
        uses: denoland/deployctl@v1
        with:
          project: YOUR_DENO_DEPLOY_PROJECT_NAME
          entrypoint: main.ts
          # root: dist
          import-map: import_map.json
          exclude: .git/** .gitignore .vscode/** .github/** README.md .env .example.env
```

3. Commit and push your code to GitHub. This should trigger the GitHub Action.
   When the action successfully completes, your app should be available on Deno
   Deploy.

### Using Docker to Deploy to any VPS

[Docker](https://docker.com) makes it easy to deploy and run your Deno app to
any virtual private server. This section will show you how to do that with AWS
Lightsail and Digital Ocean.

#### Digital Ocean

TODO

#### Amazon Lightsail

TODO

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

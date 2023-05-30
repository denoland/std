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
- Database management and user authentication with
  [Deno KV](https://deno.com/manual/runtime/kv), which provides zero config
  durable data storage. _Prefer using Supabase for data storage?
  [Check out this version of SaaSKit](https://github.com/denoland/saaskit/tree/3b1b14a97eef8859596015b22557d575d3b63c09)._
- Billing management with [Stripe](https://stripe.com/).
- [Fresh](https://fresh.deno.dev/) as the web framework and
  [Tailwind CSS](https://tailwindcss.com/) as the CSS framework.

Want to know where Deno SaaSKit is headed? Check out
**[our roadmap](https://github.com/denoland/saaskit/issues/60)**.

## Getting Started Locally

### Prerequisites

- [Deno](https://deno.com/manual/getting_started/installation)
- [Git](https://github.com/git-guides/install-git)
- [A free Stripe account](https://stripe.com)
- [Stripe CLI](https://stripe.com/docs/stripe-cli#install)

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

### Auth (OAuth)

1. [Register a new GitHub OAuth application](https://github.com/settings/applications/new)
   with the following values:

   - `Application name` = a name of your own choosing
   - `Homepage URL` = `http://localhost:8000`
   - `Authorization callback URL` = `http://localhost:8000/callback`

2. Once registered, copy the `Client ID` value to the `GITHUB_CLIENT_ID` value
   in your `.env` file.
3. Click `Generate a new client secret` and copy the resulting client secret to
   the `GITHUB_CLIENT_SECRET` environment variable in your `.env` file.

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
   stripe listen --forward-to localhost:8000/api/stripe-webhooks --events=customer.subscription.created,customer.subscription.deleted
   ```
4. Copy the webhook signing secret to [.env](.env) as `STRIPE_WEBHOOK_SECRET`.

> Note: You can use
> [Stripe's test credit cards](https://stripe.com/docs/testing) to make test
> payments while in Stripe's test mode.

### Running the Server

Finally, start the server by running:

```
deno task start
```

Go to [http://localhost:8000](http://localhost:8000) to begin playing with your
new SaaS app.

### Bootstrapping your local Database (Optional)

If the home page is feeling a little empty, run

```
deno task db:seed
```

On execution, this script will fetch 20 (customizable) of the top HN posts using
the [HackerNews API](https://github.com/HackerNews/API) to populate your home
page.

To see all the values in your local Deno KV database, run

```
deno task db:dump
```

And all kv pairs will be logged to stdout

To reset your Deno KV database, run

```
deno task db:reset
```

Since this operation is not recoverable, you will be prompted to confirm
deletion before proceeding.

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

### Authentication (OAuth)

1. [Change your OAuth app settings](https://github.com/settings/developers) to
   the following:

- `Homepage URL` = `https://{{ YOUR DOMAIN }}`
- `Authorization callback URL` = `http://{{ YOUR DOMAIN }}/callback`

### Payments (Stripe)

In order to use Stripe in production, you'll have to
[activate your Stripe account](https://stripe.com/docs/account/activate).

Once your Stripe account is activated, simply grab the production version of the
Stripe Secret Key. That will be the value of `STRIPE_SECRET_KEY` in prod.

### Automate Stripe Subscription Updates via Webhooks

Keep your user's customer information up-to-date with billing changes by
[registering a webhook endpoint in Stripe](https://stripe.com/docs/development/dashboard/register-webhook).

- Endpoint URL: `https://{{ YOUR DOMAIN }}/api/stripe-webhooks`
- Listen to `Events on your account`
- Select `customer.subscription.created` and `customer.subscription.deleted`

### Stripe Production Environmental Variables

- `STRIPE_SECRET_KEY`: Dashboard Home (Right Side of Page) -> Secret Key (only
  revealed once)
- `STRIPE_WEBHOOK_SECRET`: Dashboard Home -> Developers (right side of page) ->
  Create webhook -> Click Add Endpoint
  - After Creation, redirected to new webhook page -> Signing Secret -> Reveal
- `STRIPE_PREMIUM_PLAN_PRICE_ID`: Dashboard -> Products -> Premium Tier ->
  Pricing/API ID

### Stripe Customer Portal Branding

[Set up your branding on Stripe](https://dashboard.stripe.com/settings/branding),
as the user will be taken to Stripe's checkout page when they upgrade to a
subscription.

## Using Docker to Deploy to any VPS

[Docker](https://docker.com) makes it easy to deploy and run your Deno app to
any virtual private server (VPS). This section will show you how to do that with
AWS Lightsail and Digital Ocean.

### Setting up Docker

1. [Install Docker](https://docker.com) on your machine, which should also
   install
   [the `docker` CLI](https://docs.docker.com/engine/reference/commandline/cli/).

2. Create an account on [Docker Hub](https://hub.docker.com), a registry for
   Docker container images.

3. Create a `Dockerfile` in the root of your repo:

   ```docker
   FROM denoland/deno:1.32.4
   EXPOSE 8000
   WORKDIR /app
   ADD . /app

   # Add dependencies to the container's Deno cache
   RUN deno cache main.ts --import-map=import_map.json
   CMD ["run", "--allow-run", "--allow-write", "--allow-read", "--allow-env", "--allow-net", "main.ts"]
   ```

4. Create a `.dockerignore` file in the root folder of your repo to make sure
   certain files are not deployed to the docker container:

   ```dockerignore
   README.md
   .example.env
   .vscode/
   .github/
   ```

5. A `docker-compose.yml` file will be needed to run the docker file on a VPS.
   Here’s what that file in your repo's root folder will look like:

   ```yml
   version: '3'

   services:
     web:
       build: .
       container_name: deno-sasskit
       image: deno-image
     environment:
        - DENO_DEPLOYMENT_ID=${DENO_DEPLOYMENT_ID}
        - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
        - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
        - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
        - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
        - STRIPE_PREMIUM_PLAN_PRICE_ID=${STRIPE_PREMIUM_PLAN_PRICE_ID}
     ports:
         - "8000:8000"
   ```

The values of the environmental variables are pulled from the `.env` file.

The `DENO_DEPLOYMENT_ID` variable is needed for Docker deployment of a Deno
Fresh app for caching to work properly. Its value needs to be a unique id tied
to the deployment. We recommend using the SHA1 commit hash, which can be
obtained from the following command run in the repo's root folder:

```sh
# get the SHA1 commit hash of the current branch
git rev-parse HEAD
```

### Automatic Deployment with Deno Deploy

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

### Deno Deploy via GitHub Action

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
   # Github action to deploy this project to Deno Deploy
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

   ## Finally, deploy
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

### Deploying to Amazon Lightsail with Docker

In order to deploy your Docker image to Amazon Lightsail you need to create an
AWS account if you don’t already have one.

1. The deployment process starts with a local Docker image build which requires
   that the `Dockerfile` and `docker-compose.yml` have beed created
   [as above](#setting-up-docker):

   ```sh
   docker compose -f docker-compose.yml build
   ```

2. Tag your image locally using the following command:

   ```sh
   docker tag deno-image {{ username }}/deno-saaskit-aws
   ```

   The name `deno-image` comes from your `docker-compose.yml` file.

3. The tagged image needs to be registered on
   [Docker Hub](https://hub.docker.com). In order to do that, sign into your Hub
   account (or create one if you don’t have one).

4. Push the tagged image to Docker Hub. We have chosen the name
   `deno-saaskit-aws` which you can change. Substitute `{{username}}` with your
   Docker Hub username.

   ```sh
   docker push {{ username }}/deno-saaskit-aws
   ```

   You should then be able to see your image on Docker Hub where it can be
   picked up by the AWS container service.

5. Go to the
   [AWS LIghtsail Create a Container Service landing page](https://lightsail.aws.amazon.com/ls/webapp/create/container-service).
   On that page you can choose a server location and service capacity or keep
   the defaults.

   - Click on “Setup deployment” and choose “Specify a custom deployment” which
     will result in the display of a form. Here’s what you need to fill out:

     - _Container name_: Give it a name of your choosing.
     - _Image_: Use the Docker Hub name {{username}}/deno-saaskit-aws.
     - _Open Ports_: Click “Add open ports” and then enter “8000” as the port.
     - _Environmental Variables_: Enter the name and values of all production
       environmental variables from `.env`.
     - _Public Endpoint_: Select the container name you just entered.

   Under “Identify your service”, enter a container service name of your
   choosing. It will become part of the app's domain.

6. Click the “Create Container Service” button. It will take some time for the
   deployment to complete. You will see a "Deployed” message when it is
   finished.

After the deployment is complete, click on the public address link and you'll
see your app running in the browser.

### Deploying to Digital Ocean with Docker

To deploy your image to Digital Ocean, you will need A
[Digital Ocean account](https://www.digitalocean.com/) and the
[`doctl` CLI](https://docs.digitalocean.com/reference/doctl/how-to/install/)
installed and validated locally.

1. Build the Docker image locally and tag it for a Digital Ocean Container
   Registry. This requires that you have created `Dockerfile` and
   `docker-compose.yml` files [as instructed above](#setting-up-docker)

   ```sh
   # Local Docker build
   docker compose -f docker-compose.yml build
   ```

   ```sh
   # Tag for DO container registry (separate from Docker Hub)
   docker tag deno-image registry.digitalocean.com/deno-saaskit/deno-image:new
   ```

2. Push your tagged image to your DO container registry.

   - [Create an API token with `doctl`](https://docs.digitalocean.com/reference/doctl/how-to/install/#step-2-create-an-api-token)
     and
     [validate that you can authenticate with the CLI](https://docs.digitalocean.com/reference/doctl/how-to/install/#step-4-validate-that-doctl-is-working).

   - Login using `doctl` and the API token you just created:

   ```sh
   doctl registry login -t {{ API Access Token }}
   ```

   - Create a Digital Ocean Container Registry named `deno-saaskit`:

   ```sh
   doctl registry create deno-saaskit
   ```

   Alternatively, you can
   [create the container registry online](https://docs.digitalocean.com/products/container-registry/quickstart/).

   - Push the image to Digital Ocean’s registry (make sure you are logged in
     using `doctl registry login`).

   ```sh
   docker push registry.digitalocean.com/deno-saaskit/deno-image:new
   ```

   You should now be able to see your image in the
   [DO Container Registry](https://cloud.digitalocean.com/registry).

3. Once the `deno-image` has been pushed to the Digital Ocean registry we can
   run it in a
   [Digital Ocean Droplet](https://www.digitalocean.com/products/droplets). Go
   to your
   [Digital Ocean project page](https://cloud.digitalocean.com/projects/) and
   click the 'Create' button and select 'Droplets'.

4. When the droplet is created, use the `console` link on your droplet page to
   SSH to the droplet VM or
   [use SSH locally](https://docs.digitalocean.com/products/droplets/how-to/connect-with-ssh/)
   run this command:

   ```sh
   docker run -d --restart always -it -p 8000:8000 --name deno-image registry.digitalocean.com/deno-on-digital-ocean/deno-image:new
   ```

The URL will be visible once the command completes. Use the droplet's IP address
with port `8000` to browse to your application deployed on Digital Ocean.

## Contributing

When submitting a pull request, please follow the
[Deno Style Guide](https://deno.land/manual/references/contributing/style_guide).

Before submitting, run the following to check the formatting, linting, licenses,
and types and run tests in one hit:

```
deno task ok
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

Join
[the `#saaskit` channel in Deno's Discord](https://discord.com/channels/684898665143206084/1085986084653109438)
to meet other SaaSKit developers, ask questions, and get unblocked.

Here's a list of articles, how to guides, and videos about SaaSKit:

- [Announcing Deno SaaSKit](https://deno.com/blog/announcing-deno-saaskit)
- [Getting Started with SaaSKit (video walkthrough)](https://www.youtube.com/watch?v=1GYs3NbVCfE)

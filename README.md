# fresh project

### Usage

Start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.

## Setup Environmental Variables

Copy Supabase and Stripe credentials to `.env` same as `.example.env`.

## Setup Supabase

1. Create the todos table:
   1. Go to `Databases` > `Tables`
   1. Click `New Table`
   1. Enter the name as `todos` and check `Enable Row Level Security (RLS)`
   1. Configure the following columns:

| Name      | Type   | Default value | Primary |
| --------- | ------ | ------------- | ------- |
| `id`      | `int8` | --            | `true`  |
| `name`    | `text` | (empty)       | `false` |
| `user_id` | `uuid` | `uid()`       | `false` |

1. Setup authentication:
   1. Go to `Authentication` > `Providers` > `Email`
   1. Disable `Confirm email`
   1. Go to `Authentication` > `Policies`
   1. Click `New Policy` and then `Create a policy from scratch`
   1. Enter the policy name as
      `Enable all operations for users based on user_id`
   1. Enter the `USING expression` as `(uid() = user_id)`

## Setup Stripe (taken from Vercel's Subscription Starter)

1. Set your custom branding in the
   [settings](https://dashboard.stripe.com/settings/branding)
1. Configure the Customer Portal
   [settings](https://dashboard.stripe.com/test/settings/billing/portal)
1. Toggle on "Allow customers to update their payment methods"
1. Toggle on "Allow customers to update subscriptions"
1. Toggle on "Allow customers to cancel subscriptions"
1. Add the products and prices that you want
1. Set up the required business information and links

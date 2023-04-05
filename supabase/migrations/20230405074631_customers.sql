create table "public"."customers" (
    "user_id" uuid not null default auth.uid(),
    "stripe_customer_id" text,
    "is_subscribed" boolean default false
);


alter table "public"."customers" enable row level security;

CREATE POLICY "Enable all operations for users based on user_id" ON "public"."customers"
AS PERMISSIVE FOR ALL
TO authenticated
USING ((auth.uid() = user_id))
WITH CHECK ((auth.uid() = user_id));

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (user_id);

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."customers" add constraint "customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."customers" validate constraint "customers_user_id_fkey";
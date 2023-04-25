import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import type { SupabaseClient } from "@/utils/supabase.ts";
import type { ItemWithCommentsCount } from "@/utils/item.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import ItemSummary from "@/components/ItemSummary.tsx";
import {
  BASE_BUTTON_STYLES,
  BASE_INPUT_STYLES,
  BASE_SITE_WIDTH_STYLES,
} from "@/utils/constants.ts";
import type { Database } from "@/utils/supabase_types.ts";
import { timeAgo } from "@/components/ItemSummary.tsx";

interface ItemPageData extends State {
  item: ItemWithCommentsCount;
  comments: Database["public"]["Tables"]["comments"]["Row"][];
}

async function getItem(
  supabaseClient: SupabaseClient,
  id: ItemWithCommentsCount["id"],
) {
  return await supabaseClient
    .from("items")
    .select(`
      *,
      comments(count)
    `)
    .eq("id", id)
    .single()
    .throwOnError()
    .then(({ data }) => data);
}

async function getItemComments(
  supabaseClient: SupabaseClient,
  id: ItemWithCommentsCount["id"],
) {
  return await supabaseClient
    .from("comments")
    .select()
    .eq("item_id", id)
    .throwOnError()
    .then(({ data }) => data) || [];
}

async function createComment(
  supabaseClient: SupabaseClient,
  comment: Database["public"]["Tables"]["comments"]["Insert"],
) {
  await supabaseClient
    .from("comments")
    .insert(comment)
    .throwOnError();
}

export const handler: Handlers<ItemPageData, State> = {
  async GET(_req, ctx) {
    const { id } = ctx.params;

    const item = await getItem(ctx.state.supabaseClient, id);

    if (!item) {
      return ctx.renderNotFound();
    }

    const comments = await getItemComments(ctx.state.supabaseClient, id);

    return ctx.render({ ...ctx.state, item, comments });
  },
  async POST(req, ctx) {
    if (!ctx.state.session) {
      return new Response(null, {
        headers: {
          /** @todo Figure out `redirect_to` query */
          location: "/login",
        },
        status: 302,
      });
    }

    const form = await req.formData();
    const text = form.get("text");

    if (typeof text !== "string") {
      return new Response(null, { status: 400 });
    }

    await createComment(ctx.state.supabaseClient, {
      text,
      item_id: ctx.params.id,
    });

    return new Response(null, {
      headers: { location: `/item/${ctx.params.id}` },
      status: 302,
    });
  },
};

function Comment(comment: Database["public"]["Tables"]["comments"]["Row"]) {
  return (
    <div class="py-4">
      <p>{comment.user_id}</p>
      <p class="text-gray-500">{timeAgo(new Date(comment.created_at))} ago</p>
      <p>{comment.text}</p>
    </div>
  );
}

export default function ItemPage(props: PageProps<ItemPageData>) {
  return (
    <>
      <Head title={props.data.item.title} />
      <Layout>
        <div class={`${BASE_SITE_WIDTH_STYLES} flex-1 px-8 space-y-4`}>
          <ItemSummary {...props.data.item} />
          <div class="divide-y">
            {props.data.comments.map((comment) => <Comment {...comment} />)}
          </div>
          <form method="post">
            <textarea
              class={BASE_INPUT_STYLES}
              type="text"
              name="text"
              required
            />
            <button type="submit" class={BASE_BUTTON_STYLES}>Comment</button>
          </form>
        </div>
      </Layout>
    </>
  );
}

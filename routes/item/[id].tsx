// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import ItemSummary from "@/components/ItemSummary.tsx";
import {
  BUTTON_STYLES,
  INPUT_STYLES,
  SITE_WIDTH_STYLES,
} from "@/utils/constants.ts";
import { timeAgo } from "@/components/ItemSummary.tsx";
import {
  Comment,
  createComment,
  getCommentsByItem,
  getItemById,
  Item,
} from "@/utils/db.ts";

interface ItemPageData extends State {
  item: Item;
  comments: Comment[];
}

export const handler: Handlers<ItemPageData, State> = {
  async GET(_req, ctx) {
    const { id } = ctx.params;

    let item = await getItemById(id);
    if (item === null) {
      return ctx.renderNotFound();
    }

    const comments = await getCommentsByItem(id);
    const commentsCount = comments.length;
    item = { commentsCount, ...item };

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

    await createComment({
      userId: ctx.state.session.user.id,
      itemId: ctx.params.id,
      text,
    });

    return new Response(null, {
      headers: { location: `/item/${ctx.params.id}` },
      status: 302,
    });
  },
};

export default function ItemPage(props: PageProps<ItemPageData>) {
  return (
    <>
      <Head title={props.data.item.title} />
      <Layout isLoggedIn={props.data.isLoggedIn}>
        <div class={`${SITE_WIDTH_STYLES} flex-1 px-8 space-y-4`}>
          <ItemSummary {...props.data.item} />
          <div class="divide-y">
            {props.data.comments.map((comment) => (
              <div class="py-4">
                <p>{comment.userId}</p>
                <p class="text-gray-500">
                  {timeAgo(new Date(comment.createdAt))} ago
                </p>
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
          <form method="post">
            <textarea
              class={INPUT_STYLES}
              type="text"
              name="text"
              required
            />
            <button type="submit" class={BUTTON_STYLES}>Comment</button>
          </form>
        </div>
      </Layout>
    </>
  );
}

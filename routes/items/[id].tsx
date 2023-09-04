// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, RouteContext } from "$fresh/server.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import { BUTTON_STYLES, INPUT_STYLES } from "@/utils/constants.ts";
import {
  type Comment,
  createComment,
  createNotification,
  getAreVotedByUser,
  getItem,
  newCommentProps,
  Notification,
} from "@/utils/db.ts";
import { redirect } from "@/utils/http.ts";
import Head from "@/components/Head.tsx";
import { assertSignedIn, State } from "@/middleware/session.ts";
import CommentsList from "@/islands/CommentsList.tsx";
import { monotonicUlid } from "std/ulid/mod.ts";
import { errors } from "std/http/http_errors.ts";

/** @todo Move to `POST /api/comments` */
export const handler: Handlers<unknown, State> = {
  async POST(req, ctx) {
    assertSignedIn(ctx);

    const form = await req.formData();
    const text = form.get("text");

    if (typeof text !== "string") {
      throw new errors.BadRequest("Title must be a string");
    }

    const itemId = ctx.params.id;
    const item = await getItem(itemId);

    if (item === null) throw new errors.NotFound("Item not found");

    const { sessionUser } = ctx.state;
    const comment: Comment = {
      userLogin: sessionUser.login,
      itemId: itemId,
      text,
      ...newCommentProps(),
    };
    await createComment(comment);

    if (item.userLogin !== sessionUser.login) {
      const notification: Notification = {
        id: monotonicUlid(),
        userLogin: item.userLogin,
        type: "comment",
        text: `${sessionUser.login} commented on your post: ${item.title}`,
        originUrl: `/items/${itemId}`,
      };
      await createNotification(notification);
    }

    return redirect(`/items/${itemId}`);
  },
};

function CommentInput() {
  return (
    <form method="post">
      <textarea
        class={`${INPUT_STYLES} w-full`}
        type="text"
        name="text"
        required
      />
      <button type="submit" class={BUTTON_STYLES}>Comment</button>
    </form>
  );
}

export default async function ItemsItemPage(
  _req: Request,
  ctx: RouteContext<undefined, State>,
) {
  const itemId = ctx.params.id;
  const item = await getItem(itemId);
  if (item === null) return await ctx.renderNotFound();

  let isVoted = false;
  if (ctx.state.sessionUser !== undefined) {
    const areVoted = await getAreVotedByUser(
      [item],
      ctx.state.sessionUser.login,
    );
    isVoted = areVoted[0];
  }

  return (
    <>
      <Head title={item.title} href={ctx.url.href} />
      <main class="flex-1 p-4 space-y-8">
        <ItemSummary
          item={item}
          isVoted={isVoted}
        />
        <CommentInput />
        <CommentsList itemId={ctx.params.id} />
      </main>
    </>
  );
}

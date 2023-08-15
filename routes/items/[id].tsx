// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, RouteContext } from "$fresh/server.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import { BUTTON_STYLES, INPUT_STYLES } from "@/utils/constants.ts";
import {
  type Comment,
  createComment,
  createNotification,
  getAreVotedBySessionId,
  getItem,
  getUserBySession,
  listCommentsByItem,
  newCommentProps,
  newNotificationProps,
  Notification,
  valuesFromIter,
} from "@/utils/db.ts";
import UserPostedAt from "@/components/UserPostedAt.tsx";
import { redirect } from "@/utils/redirect.ts";
import Head from "@/components/Head.tsx";
import { SignedInState } from "@/utils/middleware.ts";
import PaginationLink from "@/components/PaginationLink.tsx";

export const handler: Handlers<unknown, SignedInState> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const text = form.get("text");

    if (typeof text !== "string") {
      return new Response(null, { status: 400 });
    }

    const itemId = ctx.params.id;
    const user = await getUserBySession(ctx.state.sessionId);
    const item = await getItem(itemId);

    if (item === null || user === null) {
      return new Response(null, { status: 404 });
    }

    const comment: Comment = {
      userLogin: user.login,
      itemId: itemId,
      text,
      ...newCommentProps(),
    };
    await createComment(comment);

    if (item.userLogin !== user.login) {
      const notification: Notification = {
        userLogin: item.userLogin,
        type: "comment",
        text: `${user.login} commented on your post: ${item.title}`,
        originUrl: `/items/${itemId}`,
        ...newNotificationProps(),
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

function CommentSummary(props: Comment) {
  return (
    <div class="py-4">
      <UserPostedAt {...props} />
      <p>{props.text}</p>
    </div>
  );
}

export default async function ItemsItemPage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  const itemId = ctx.params.id;
  const item = await getItem(itemId);
  if (item === null) return await ctx.renderNotFound();

  const cursor = ctx.url.searchParams.get("cursor") ?? undefined;
  const iter = listCommentsByItem(itemId, { cursor });
  const comments = await valuesFromIter(iter);

  const [isVoted] = await getAreVotedBySessionId(
    [item],
    ctx.state.sessionId,
  );

  return (
    <>
      <Head title={item.title} href={ctx.url.href} />
      <main class="flex-1 p-4 space-y-8">
        <ItemSummary
          item={item}
          isVoted={isVoted}
        />
        <CommentInput />
        <div>
          {comments.map((comment) => (
            <CommentSummary
              {...comment}
            />
          ))}
        </div>
        <PaginationLink
          url={ctx.url}
          cursor={iter.cursor}
          class="text-centre my-8"
        />
      </main>
    </>
  );
}

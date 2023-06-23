// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import Head from "@/components/Head.tsx";
import ItemSummary from "@/components/ItemSummary.tsx";
import PageSelector from "@/components/PageSelector.tsx";
import {
  BUTTON_STYLES,
  INPUT_STYLES,
  SITE_WIDTH_STYLES,
} from "@/utils/constants.ts";
import { calcLastPage, calcPageNum, PAGE_LENGTH } from "@/utils/pagination.ts";
import {
  type Comment,
  createComment,
  getAreVotedBySessionId,
  getCommentsByItem,
  getItem,
  getManyUsers,
  getUser,
  getUserBySession,
  type Item,
  newCommentProps,
  type User,
} from "@/utils/db.ts";
import { redirect } from "@/utils/redirect.ts";
import UserPostedAt from "@/components/UserPostedAt.tsx";
import { redirectToLogin } from "@/utils/redirect.ts";

interface ItemPageData extends State {
  user: User;
  item: Item;
  comments: Comment[];
  commentsUsers: User[];
  isVoted: boolean;
  lastPage: number;
}

export const handler: Handlers<ItemPageData, State> = {
  async GET(req, ctx) {
    const { id } = ctx.params;

    const url = new URL(req.url);
    const pageNum = calcPageNum(url);

    const item = await getItem(id);
    if (item === null) {
      return ctx.renderNotFound();
    }

    const allComments = await getCommentsByItem(id);
    const comments = allComments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((pageNum - 1) * PAGE_LENGTH, pageNum * PAGE_LENGTH);

    const commentsUsers = await getManyUsers(
      comments.map((comment) => comment.userId),
    );
    const user = await getUser(item.userId);

    const [isVoted] = await getAreVotedBySessionId(
      [item],
      ctx.state.sessionId,
    );

    const lastPage = calcLastPage(allComments.length, PAGE_LENGTH);

    return ctx.render({
      ...ctx.state,
      item,
      comments,
      user: user!,
      commentsUsers,
      isVoted,
      lastPage,
    });
  },
  async POST(req, ctx) {
    if (!ctx.state.sessionId) {
      return redirectToLogin(req.url);
    }

    const form = await req.formData();
    const text = form.get("text");

    if (typeof text !== "string") {
      return new Response(null, { status: 400 });
    }

    const user = await getUserBySession(ctx.state.sessionId);

    const comment: Comment = {
      userId: user!.id,
      itemId: ctx.params.id,
      text,
      ...newCommentProps(),
    };
    await createComment(comment);

    return redirect(`/item/${ctx.params.id}`);
  },
};

function CommentInput() {
  return (
    <form method="post">
      <textarea
        class={INPUT_STYLES}
        type="text"
        name="text"
        required
      />
      <button type="submit" class={BUTTON_STYLES}>Comment</button>
    </form>
  );
}

function CommentSummary(
  props: { user: User; comment: Comment },
) {
  return (
    <div class="py-4">
      <UserPostedAt
        user={props.user}
        createdAt={props.comment.createdAt}
      />
      <p>{props.comment.text}</p>
    </div>
  );
}

export default function ItemPage(props: PageProps<ItemPageData>) {
  return (
    <>
      <Head title={props.data.item.title} href={props.url.href} />
      <div class={`${SITE_WIDTH_STYLES} flex-1 px-4 space-y-8`}>
        <ItemSummary
          item={props.data.item}
          isVoted={props.data.isVoted}
          user={props.data.user}
        />
        <CommentInput />
        <div>
          {props.data.comments.map((comment, index) => (
            <CommentSummary
              user={props.data.commentsUsers[index]}
              comment={comment}
            />
          ))}
        </div>
        {props.data.lastPage > 1 && (
          <PageSelector
            currentPage={calcPageNum(props.url)}
            lastPage={props.data.lastPage}
          />
        )}
      </div>
    </>
  );
}

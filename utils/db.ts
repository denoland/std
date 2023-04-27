// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export const kv = await Deno.openKv();

const versionstamp = null;

export interface InitItemValue {
  authorId: string;
  title: string;
  url: string;
}

export async function createItem(initItem: InitItemValue) {
  const itemId = crypto.randomUUID();

  const itemKey = ["items", crypto.randomUUID()];
  const itemsByAuthorKey = ["items_by_author", initItem.authorId, itemId];

  const item: ItemValue = { ...initItem, score: 0, createdAt: new Date() };
  const res = await kv.atomic()
    .check({ key: itemKey, versionstamp })
    .check({ key: itemsByAuthorKey, versionstamp })
    .set(itemKey, item)
    .set(itemsByAuthorKey, item)
    .commit();

  if (res === null) {
    throw new TypeError("Item with ID or for author already exists");
  }
  return res;
}

export interface ItemValue extends InitItemValue {
  createdAt: Date;
  score: number;
}

export async function getItems(options?: Deno.KvListOptions) {
  const iter = await kv.list<ItemValue>({ prefix: ["items"] }, options);
  const items = [];
  for await (const res of iter) items.push(res);
  return items;
}

export async function getItem(id: string) {
  return await kv.get<ItemValue>(["items", id]);
}

export interface InitCommentValue {
  authorId: string;
  itemId: string;
  text: string;
}

export async function createComment(initComment: InitCommentValue) {
  const commentId = crypto.randomUUID();

  const commentsByAuthorKey = [
    "comments_by_authors",
    initComment.authorId,
    commentId,
  ];
  const commentsByItemKey = ["comments_by_item", initComment.itemId, commentId];

  const comment: CommentValue = { ...initComment, createdAt: new Date() };
  const res = await kv.atomic()
    .check({ key: commentsByAuthorKey, versionstamp })
    .check({ key: commentsByItemKey, versionstamp })
    .set(commentsByAuthorKey, comment)
    .set(commentsByItemKey, comment)
    .commit();

  if (res === null) {
    throw new TypeError("Comment with ID for item or author already exists");
  }

  return res;
}

export interface CommentValue extends InitCommentValue {
  createdAt: Date;
}

export async function getItemComments(
  itemId: string,
  options?: Deno.KvListOptions,
) {
  const iter = await kv.list<CommentValue>({
    prefix: ["comments_by_item", itemId],
  }, options);
  const comments = [];
  for await (const res of iter) comments.push(res);
  return comments;
}

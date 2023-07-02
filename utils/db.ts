// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { chunk } from "std/collections/chunk.ts";

const KV_PATH_KEY = "KV_PATH";
let path = undefined;
if (
  (await Deno.permissions.query({ name: "env", variable: KV_PATH_KEY }))
    .state === "granted"
) {
  path = Deno.env.get(KV_PATH_KEY);
}
export const kv = await Deno.openKv(path);

// Helpers
async function getValue<T>(
  key: Deno.KvKey,
  options?: { consistency?: Deno.KvConsistencyLevel },
) {
  const res = await kv.get<T>(key, options);
  return res.value;
}

async function getValues<T>(
  selector: Deno.KvListSelector,
  options?: Deno.KvListOptions,
) {
  const values = [];
  const iter = kv.list<T>(selector, options);
  for await (const { value } of iter) values.push(value);
  return values;
}

/**
 * Gets many values from KV. Uses batched requests to get values in chunks of 10.
 */
async function getManyValues<T>(
  keys: Deno.KvKey[],
): Promise<(T | null)[]> {
  const promises = [];
  for (const batch of chunk(keys, 10)) {
    promises.push(kv.getMany<T[]>(batch));
  }
  return (await Promise.all(promises))
    .flat()
    .map((entry) => entry?.value);
}

/** Gets all dates since a given number of milliseconds ago */
export function getDatesSince(msAgo: number) {
  const dates = [];
  const now = Date.now();
  const start = new Date(now - msAgo);

  while (+start < now) {
    start.setDate(start.getDate() + 1);
    dates.push(formatDate(new Date(start)));
  }

  return dates;
}

/** Converts `Date` to ISO format that is zero UTC offset */
export function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

// Item
export interface Item {
  userId: string;
  title: string;
  url: string;
  // The below properties can be automatically generated upon item creation
  id: string;
  createdAt: Date;
  score: number;
}

export function newItemProps(): Pick<Item, "id" | "score" | "createdAt"> {
  return {
    id: crypto.randomUUID(),
    score: 0,
    createdAt: new Date(),
  };
}

/**
 * Creates a new item in KV. Throws if the item already exists in one of the indexes.
 *
 * @example New item creation
 * ```ts
 * import { newItemProps, createItem } from "@/utils/db.ts";
 *
 * const item: Item = {
 *   userId: "example-user-id",
 *   title: "example-title",
 *   url: "https://example.com"
 *   ..newItemProps(),
 * };
 *
 * await createItem(item);
 * ```
 */
export async function createItem(item: Item) {
  const itemsKey = ["items", item.id];
  const itemsByTimeKey = ["items_by_time", item.createdAt.getTime(), item.id];
  const itemsByUserKey = ["items_by_user", item.userId, item.id];
  const itemsCountKey = ["items_count", formatDate(new Date())];

  const res = await kv.atomic()
    .check({ key: itemsKey, versionstamp: null })
    .check({ key: itemsByTimeKey, versionstamp: null })
    .check({ key: itemsByUserKey, versionstamp: null })
    .set(itemsKey, item)
    .set(itemsByTimeKey, item)
    .set(itemsByUserKey, item)
    .sum(itemsCountKey, 1n)
    .commit();

  if (!res.ok) throw new Error(`Failed to create item: ${item}`);
}

export async function deleteItem(item: Item) {
  const itemsKey = ["items", item.id];
  const itemsByTimeKey = ["items_by_time", item.createdAt.getTime(), item.id];
  const itemsByUserKey = ["items_by_user", item.userId, item.id];

  const res = await kv.atomic()
    .delete(itemsKey)
    .delete(itemsByTimeKey)
    .delete(itemsByUserKey)
    .commit();

  if (!res.ok) throw new Error(`Failed to delete item: ${item}`);
}

export async function getItem(id: string) {
  return await getValue<Item>(["items", id]);
}

export async function getItemsByUser(userId: string) {
  return await getValues<Item>({ prefix: ["items_by_user", userId] });
}

export async function getAllItems() {
  return await getValues<Item>({ prefix: ["items"] });
}

/**
 * Gets all items since a given number of milliseconds ago from KV.
 *
 * @example Since a week ago
 * ```ts
 * import { WEEK } from "std/datetime/constants.ts";
 * import { getItemsSince } from "@/utils/db.ts";
 *
 * const itemsSinceAllTime = await getItemsSince(WEEK);
 * ```
 *
 * @example Since a month ago
 * ```ts
 * import { DAY } from "std/datetime/constants.ts";
 * import { getItemsSince } from "@/utils/db.ts";
 *
 * const itemsSinceAllTime = await getItemsSince(DAY * 30);
 * ```
 */
export async function getItemsSince(msAgo: number) {
  return await getValues<Item>({
    prefix: ["items_by_time"],
    start: ["items_by_time", Date.now() - msAgo],
  });
}

// Notification
export interface Notification {
  userId: string;
  type: string;
  text: string;
  originUrl: string;
  // The below properties can be automatically generated upon notification creation
  id: string;
  createdAt: Date;
}

export function newNotificationProps(): Pick<Item, "id" | "createdAt"> {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
}

/**
 * Creates a new notification in KV. Throws if the item already exists in one of the indexes.
 *
 * @example New notification creation
 * ```ts
 * import { newNotificationProps, createNotification } from "@/utils/db.ts";
 *
 * const notification: Notification = {
 *   userId: "example-user-id",
 *   type: "example-type",
 *   userFromId: "example-user-from-id"
 *   userFromLogin: "example-user-from-login"
 *   originId: "example-origin-id"
 *   originTitle: "example-origin-title"
 *   ...newNotificationProps(),
 * };
 *
 * await createNotification(notification);
 * ```
 */
export async function createNotification(notification: Notification) {
  const notificationsKey = ["notifications", notification.id];
  const notificationsByTimeKey = [
    "notifications_by_time",
    notification.createdAt.getTime(),
    notification.id,
  ];
  const notificationsByUserKey = [
    "notifications_by_user",
    notification.userId,
    notification.id,
  ];

  const res = await kv.atomic()
    .check({ key: notificationsKey, versionstamp: null })
    .check({ key: notificationsByTimeKey, versionstamp: null })
    .check({ key: notificationsByUserKey, versionstamp: null })
    .set(notificationsKey, notification)
    .set(notificationsByTimeKey, notification)
    .set(notificationsByUserKey, notification)
    .commit();

  if (!res.ok) {
    throw new Error(`Failed to create notification: ${notification}`);
  }
}

export async function deleteNotification(notification: Notification) {
  const notificationsKey = ["notifications", notification.id];
  const notificationsByTimeKey = [
    "notifications_by_time",
    notification.createdAt.getTime(),
    notification.id,
  ];
  const notificationsByUserKey = [
    "notifications_by_user",
    notification.userId,
    notification.id,
  ];

  const res = await kv.atomic()
    .delete(notificationsKey)
    .delete(notificationsByTimeKey)
    .delete(notificationsByUserKey)
    .commit();

  if (!res.ok) {
    throw new Error(`Failed to delete notification: ${notification}`);
  }
}

export async function getNotification(id: string) {
  return await getValue<Notification>(["notifications", id]);
}

export async function getNotificationsByUser(userId: string) {
  return await getValues<Notification>({
    prefix: ["notifications_by_user", userId],
  });
}

export async function ifUserHasNotifications(userId: string) {
  const iter = kv.list({ prefix: ["notifications_by_user", userId] }, {
    consistency: "eventual",
  });
  for await (const _entry of iter) return true;
  return false;
}

// Comment
export interface Comment {
  userId: string;
  itemId: string;
  text: string;
  // The below properties can be automatically generated upon comment creation
  id: string;
  createdAt: Date;
}

export function newCommentProps(): Pick<Comment, "id" | "createdAt"> {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
}

export async function createComment(comment: Comment) {
  const commentsByItemKey = ["comments_by_item", comment.itemId, comment.id];

  const res = await kv.atomic()
    .check({ key: commentsByItemKey, versionstamp: null })
    .set(commentsByItemKey, comment)
    .commit();

  if (!res.ok) throw new Error(`Failed to create comment: ${comment}`);
}

export async function deleteComment(comment: Comment) {
  const commentsByItemKey = ["comments_by_item", comment.itemId, comment.id];

  const res = await kv.atomic()
    .delete(commentsByItemKey)
    .commit();

  if (!res.ok) throw new Error(`Failed to delete comment: ${comment}`);
}

export async function getCommentsByItem(itemId: string) {
  return await getValues<Comment>({ prefix: ["comments_by_item", itemId] });
}

// Vote
interface Vote {
  item: Item;
  user: User;
}

export async function createVote(vote: Vote) {
  vote.item.score++;

  const itemKey = ["items", vote.item.id];
  const itemsByTimeKey = [
    "items_by_time",
    vote.item.createdAt.getTime(),
    vote.item.id,
  ];
  const itemsByUserKey = ["items_by_user", vote.item.userId, vote.item.id];
  const votedItemsByUserKey = [
    "voted_items_by_user",
    vote.user.id,
    vote.item.id,
  ];
  const votedUsersByItemKey = [
    "voted_users_by_item",
    vote.item.id,
    vote.user.id,
  ];
  const votesCountKey = ["votes_count", formatDate(new Date())];

  const [itemRes, itemsByTimeRes, itemsByUserRes] = await kv.getMany([
    itemKey,
    itemsByTimeKey,
    itemsByUserKey,
  ]);
  const res = await kv.atomic()
    .check(itemRes)
    .check(itemsByTimeRes)
    .check(itemsByUserRes)
    .check({ key: votedItemsByUserKey, versionstamp: null })
    .check({ key: votedUsersByItemKey, versionstamp: null })
    .set(itemKey, vote.item)
    .set(itemsByTimeKey, vote.item)
    .set(itemsByUserKey, vote.item)
    .set(votedItemsByUserKey, vote.item)
    .set(votedUsersByItemKey, vote.user)
    .sum(votesCountKey, 1n)
    .commit();

  if (!res.ok) throw new Error(`Failed to set vote: ${vote}`);

  return vote;
}

export async function deleteVote(vote: Vote) {
  vote.item.score--;

  const votedItemsByUserKey = [
    "voted_items_by_user",
    vote.user.id,
    vote.item.id,
  ];
  const votedUsersByItemKey = [
    "voted_users_by_item",
    vote.item.id,
    vote.user.id,
  ];

  const [votedItemsByUserRes, votedUsersByItemRes] = await kv.getMany([
    votedItemsByUserKey,
    votedUsersByItemKey,
  ]);

  if (!votedItemsByUserRes.value || !votedUsersByItemRes.value) {
    throw new Error(`Failed to delete vote: ${vote}`);
  }

  const itemKey = ["items", vote.item.id];
  const itemsByTimeKey = [
    "items_by_time",
    vote.item.createdAt.getTime(),
    vote.item.id,
  ];
  const itemsByUserKey = ["items_by_user", vote.item.userId, vote.item.id];

  const [itemRes, itemsByTimeRes, itemsByUserRes] = await kv.getMany([
    itemKey,
    itemsByTimeKey,
    itemsByUserKey,
  ]);

  const res = await kv.atomic()
    .check(itemRes)
    .check(itemsByTimeRes)
    .check(itemsByUserRes)
    .set(itemKey, vote.item)
    .set(itemsByTimeKey, vote.item)
    .set(itemsByUserKey, vote.item)
    .delete(votedItemsByUserKey)
    .delete(votedUsersByItemKey)
    .commit();

  if (!res.ok) throw new Error(`Failed to delete vote: ${vote}`);
}

export async function getVotedItemsByUser(userId: string) {
  return await getValues<Item>({ prefix: ["voted_items_by_user", userId] });
}

// User
export interface User {
  id: string;
  login: string;
  avatarUrl: string;
  sessionId: string;
  stripeCustomerId?: string;
  // The below properties can be automatically generated upon comment creation
  isSubscribed: boolean;
}

export function newUserProps(): Pick<User, "isSubscribed"> {
  return {
    isSubscribed: false,
  };
}

/**
 * Creates a new user in KV. Throws if the user already exists.
 *
 * @example
 * ```ts
 * import { createUser, newUser } from "@/utils/db.ts";
 *
 * const user = {
 *   id: "id",
 *   login: "login",
 *   avatarUrl: "https://example.com/avatar-url",
 *   sessionId: "sessionId",
 *   ...newUserProps(),
 * };
 * await createUser(user);
 * ```
 */
export async function createUser(user: User) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];
  const usersCountKey = ["users_count", formatDate(new Date())];

  const atomicOp = kv.atomic();

  if (user.stripeCustomerId !== undefined) {
    const usersByStripeCustomerKey = [
      "users_by_stripe_customer",
      user.stripeCustomerId,
    ];
    atomicOp
      .check({ key: usersByStripeCustomerKey, versionstamp: null })
      .set(usersByStripeCustomerKey, user);
  }

  const res = await atomicOp
    .check({ key: usersKey, versionstamp: null })
    .check({ key: usersByLoginKey, versionstamp: null })
    .check({ key: usersBySessionKey, versionstamp: null })
    .set(usersKey, user)
    .set(usersByLoginKey, user)
    .set(usersBySessionKey, user)
    .sum(usersCountKey, 1n)
    .commit();

  if (!res.ok) throw new Error(`Failed to create user: ${user}`);
}

export async function updateUser(user: User) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];

  const atomicOp = kv.atomic();

  if (user.stripeCustomerId !== undefined) {
    const usersByStripeCustomerKey = [
      "users_by_stripe_customer",
      user.stripeCustomerId,
    ];
    atomicOp
      .set(usersByStripeCustomerKey, user);
  }

  const res = await atomicOp
    .set(usersKey, user)
    .set(usersByLoginKey, user)
    .set(usersBySessionKey, user)
    .commit();

  if (!res.ok) throw new Error(`Failed to update user: ${user}`);
}

export async function deleteUserBySession(sessionId: string) {
  await kv.delete(["users_by_session", sessionId]);
}

export async function getUser(id: string) {
  return await getValue<User>(["users", id]);
}

export async function getUserByLogin(login: string) {
  return await getValue<User>(["users_by_login", login]);
}

export async function getUserBySession(sessionId: string) {
  const usersBySessionKey = ["users_by_session", sessionId];
  return await getValue<User>(usersBySessionKey, {
    consistency: "eventual",
  }) ?? await getValue<User>(usersBySessionKey);
}

export async function getUserByStripeCustomer(stripeCustomerId: string) {
  return await getValue<User>([
    "users_by_stripe_customer",
    stripeCustomerId,
  ]);
}

export async function getManyUsers(ids: string[]) {
  const keys = ids.map((id) => ["users", id]);
  const res = await getManyValues<User>(keys);
  return res.filter(Boolean) as User[];
}

export async function getAreVotedBySessionId(
  items: Item[],
  sessionId?: string,
) {
  if (!sessionId) return [];
  const sessionUser = await getUserBySession(sessionId);
  if (!sessionUser) return [];
  const votedItems = await getVotedItemsByUser(sessionUser.id);
  const votedItemIds = votedItems.map((item) => item.id);
  return items.map((item) => votedItemIds.includes(item.id));
}

export function compareScore(a: Item, b: Item) {
  return Number(b.score) - Number(a.score);
}

// Analytics
export async function incrVisitsCountByDay(date: Date) {
  const visitsKey = ["visits_count", formatDate(date)];
  await kv.atomic()
    .sum(visitsKey, 1n)
    .commit();
}

export async function getManyMetrics(
  metric: "visits_count" | "items_count" | "votes_count" | "users_count",
  dates: Date[],
) {
  const keys = dates.map((date) => [metric, formatDate(date)]);
  const res = await getManyValues<bigint>(keys);
  return res.map((value) => value?.valueOf() ?? 0n);
}

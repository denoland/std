// Copyright 2023 the Deno authors. All rights reserved. MIT license.
// Description: Seeds the kv db with Hacker News stories
import { createItem, createUser, type Item, kv } from "@/utils/db.ts";

// Reference: https://github.com/HackerNews/API
const API_BASE_URL = `https://hacker-news.firebaseio.com/v0`;

interface Story {
  id: number;
  score: number;
  time: number; // Unix seconds
  by: string;
  title: string;
  url: string;
}

function* batchify<T>(arr: T[], n = 5): Generator<T[], void> {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}

// Fetches the top 500 HN stories to seed the db
async function fetchTopStoryIds() {
  const resp = await fetch(`${API_BASE_URL}/topstories.json`);
  if (!resp.ok) {
    console.error(`Failed to fetchTopStoryIds - status: ${resp.status}`);
    return;
  }
  return await resp.json();
}

async function fetchStory(id: number | string) {
  const resp = await fetch(`${API_BASE_URL}/item/${id}.json`);
  if (!resp.ok) {
    console.error(`Failed to fetchStory (${id}) - status: ${resp.status}`);
    return;
  }
  return await resp.json();
}

async function fetchTopStories(limit = 10) {
  const ids = await fetchTopStoryIds();
  if (!(ids && ids.length)) {
    console.error(`No ids to fetch!`);
    return;
  }
  const filtered: [number] = ids.slice(0, limit);
  const stories: Story[] = [];
  for (const batch of batchify(filtered)) {
    stories.push(...(await Promise.all(batch.map((id) => fetchStory(id))))
      .filter((v) => Boolean(v)) as Story[]);
  }
  return stories;
}

async function createItemWithScore(item: Item) {
  const res = await createItem(item);
  return await kv.set(["items", res!.id], {
    ...res,
    score: item.score,
    createdAt: item.createdAt,
  });
}

async function seedSubmissions(stories: Story[]) {
  const items = stories.map(({ by: userId, title, url, score, time }) => {
    return {
      userId,
      title,
      url,
      score,
      createdAt: new Date(time * 1000),
    } as Item;
  }).filter(({ url }) => url);
  for (const batch of batchify(items)) {
    await Promise.all(batch.map((item) => createItemWithScore(item)));
  }
  return items;
}

async function main(limit = 20) {
  const stories = await fetchTopStories(limit);
  if (!(stories && stories.length)) {
    console.error(`No stories to seed!`);
    return;
  }
  const items = await seedSubmissions(stories);

  // Create dummy users to ensure each post has a corresponding user
  for (const batch of batchify(items)) {
    await Promise.allSettled(batch.map(({ userId: id }) =>
      createUser({
        id, // id must match userId for post
        login: id,
        avatarUrl: "https://www.gravatar.com/avatar/?d=mp&s=64",
        stripeCustomerId: crypto.randomUUID(), // unique per userId
        sessionId: crypto.randomUUID(), // unique per userId
      }) // ignore errors if dummy user already exists
    ));
  }
}

if (import.meta.main) {
  await main();
}

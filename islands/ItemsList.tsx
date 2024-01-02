// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { Signal, useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { type Item } from "@/utils/db.ts";
import IconInfo from "tabler_icons_tsx/info-circle.tsx";
import { fetchValues } from "@/utils/http.ts";
import { decodeTime } from "std/ulid/mod.ts";
import { timeAgo } from "@/utils/display.ts";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";

async function fetchVotedItems() {
  const url = "/api/me/votes";
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Request failed: GET ${url}`);
  return await resp.json() as Item[];
}

function EmptyItemsList() {
  return (
    <div class="flex flex-col justify-center items-center gap-2 pt-16">
      <IconInfo class="w-10 h-10 text-gray-400 dark:text-gray-600" />
      <p>No items found</p>
      <a href="/submit" class="text-primary hover:underline">
        Submit your project &#8250;
      </a>
    </div>
  );
}

interface VoteButtonProps {
  item: Item;
  scoreSig: Signal<number>;
  isVotedSig: Signal<boolean>;
}

function VoteButton(props: VoteButtonProps) {
  async function onClick(event: MouseEvent) {
    if (event.detail !== 1) return;
    const resp = await fetch(`/api/vote?item_id=${props.item.id}`, {
      method: "POST",
    });
    if (!resp.ok) throw new Error(await resp.text());
    props.scoreSig.value++;
    props.isVotedSig.value = true;
  }

  return (
    <button onClick={onClick} class="hover:text-primary">
      ▲
    </button>
  );
}

interface ItemSummaryProps {
  item: Item;
  /** Whether the item has been voted-for by the signed-in user */
  isVoted: boolean;
  /** Whether the user is signed-in */
  isSignedIn: boolean;
}

function ItemSummary(props: ItemSummaryProps) {
  const scoreSig = useSignal(props.item.score);
  const isVotedSig = useSignal(props.isVoted);

  return (
    <div class="py-2 flex gap-4">
      <div
        class={`pr-2 text-center flex flex-col justify-center ${
          isVotedSig.value ? "text-primary" : "hover:text-primary"
        }`}
      >
        {!props.isSignedIn && (
          <a
            title="Sign in to vote"
            href="/signin"
          >
            ▲
          </a>
        )}
        {props.isSignedIn && !isVotedSig.value && (
          <VoteButton
            item={props.item}
            scoreSig={scoreSig}
            isVotedSig={isVotedSig}
          />
        )}
        <p>{scoreSig}</p>
      </div>
      <div class="space-y-1">
        <p>
          <a
            class="visited:text-[purple] visited:dark:text-[lightpink] hover:underline mr-4"
            href={props.item.url}
          >
            {props.item.title}
          </a>
          <a
            class="hover:underline text-gray-500 after:content-['_↗']"
            href={props.item.url}
            target="_blank"
          >
            {new URL(props.item.url).host}
          </a>
        </p>
        <p class="text-gray-500">
          <GitHubAvatarImg
            login={props.item.userLogin}
            size={24}
            class="mr-2"
          />
          <a class="hover:underline" href={`/users/${props.item.userLogin}`}>
            {props.item.userLogin}
          </a>{" "}
          {timeAgo(new Date(decodeTime(props.item.id)))}
        </p>
      </div>
    </div>
  );
}

export interface ItemsListProps {
  /** Endpoint URL of the REST API to make the fetch request to */
  endpoint: string;
  /** Whether the user is signed-in */
  isSignedIn: boolean;
}

export default function ItemsList(props: ItemsListProps) {
  const itemsSig = useSignal<Item[]>([]);
  const votedItemsIdsSig = useSignal<string[]>([]);
  const cursorSig = useSignal("");
  const isLoadingSig = useSignal<boolean | undefined>(undefined);
  const itemsAreVotedSig = useComputed(() =>
    itemsSig.value.map((item) => votedItemsIdsSig.value.includes(item.id))
  );

  async function loadMoreItems() {
    if (isLoadingSig.value) return;
    isLoadingSig.value = true;
    try {
      const { values, cursor } = await fetchValues<Item>(
        props.endpoint,
        cursorSig.value,
      );
      itemsSig.value = [...itemsSig.value, ...values];
      cursorSig.value = cursor;
    } catch (error) {
      console.error(error.message);
    } finally {
      isLoadingSig.value = false;
    }
  }

  useEffect(() => {
    if (!props.isSignedIn) {
      loadMoreItems();
      return;
    }

    fetchVotedItems()
      .then((votedItems) =>
        votedItemsIdsSig.value = votedItems.map(({ id }) => id)
      )
      .finally(() => loadMoreItems());
  }, []);

  if (isLoadingSig.value === undefined) {
    return <p class="link-styles">Loading...</p>;
  }

  return (
    <div>
      {itemsSig.value.length
        ? itemsSig.value.map((item, id) => {
          return (
            <ItemSummary
              key={item.id}
              item={item}
              isVoted={itemsAreVotedSig.value[id]}
              isSignedIn={props.isSignedIn}
            />
          );
        })
        : <EmptyItemsList />}
      {cursorSig.value !== "" && (
        <button onClick={loadMoreItems} class="link-styles">
          {isLoadingSig.value ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}

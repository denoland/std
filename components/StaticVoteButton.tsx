// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export interface StaticVoteButton {
  score: number;
}

export default function StaticVoteButton(props: StaticVoteButton) {
  return (
    <a
      class="text-inherit pr-2 text-center"
      title="Sign in to vote"
      href="/signin"
    >
      ▲
      <br />
      {props.score}
    </a>
  );
}

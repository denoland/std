// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { createGitHubOAuthConfig } from "kv_oauth/mod.ts";
import { BadRequestError } from "@/utils/http.ts";

export function isGitHubSetup() {
  try {
    createGitHubOAuthConfig();
    return true;
  } catch {
    return false;
  }
}

interface GitHubUser {
  login: string;
  email: string;
}

/**
 * Returns the GitHub profile information of the user with the given access
 * token.
 *
 * @see {@link https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user}
 *
 * @example
 * ```ts
 * import { getGitHubUser } from "@/utils/github.ts";
 *
 * const user = await getGitHubUser("<access token>");
 * user.login; // Returns "octocat"
 * user.email; // Returns "octocat@github.com"
 * ```
 */
export async function getGitHubUser(accessToken: string) {
  const resp = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    const { message } = await resp.json();
    throw new BadRequestError(message);
  }
  return await resp.json() as Promise<GitHubUser>;
}

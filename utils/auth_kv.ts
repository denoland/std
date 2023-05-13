import {
  type Cookie,
  deleteCookie,
  getCookies,
  setCookie,
} from "std/http/cookie.ts";
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.0/mod.ts";
import { kv } from "./db.ts";

const OAUTH_COOKIE_NAME = "oauth-session";

const oauth2Client = new OAuth2Client({
  clientId: Deno.env.get("GITHUB_CLIENT_ID")!,
  clientSecret: Deno.env.get("GITHUB_CLIENT_SECRET")!,
  authorizationEndpointUri: "https://github.com/login/oauth/authorize",
  tokenUri: "https://github.com/login/oauth/access_token",
  defaults: {
    scope: "read:user",
  },
});

interface OAuthSession {
  state: string;
  codeVerifier: string;
}

async function setOAuthSession(id: string, session: OAuthSession) {
  await kv.set(["oauth_sessions", id], session);
}

function createOAuthSessionCookie(value: string) {
  return {
    name: OAUTH_COOKIE_NAME,
    value,
    httpOnly: true,
  } as Cookie;
}

export async function redirectToOAuthLogin() {
  // Generate a random state
  const state = crypto.randomUUID();
  const { uri, codeVerifier } = await oauth2Client.code
    .getAuthorizationUri({ state });

  // Associate the state and PKCE code verifier with a session cookie
  const oauthSessionId = crypto.randomUUID();
  await setOAuthSession(oauthSessionId, { state, codeVerifier });

  const headers = new Headers({ location: uri.toString() });
  setCookie(headers, createOAuthSessionCookie(oauthSessionId));

  // Redirect to the authorization endpoint
  return new Response(null, { status: 302, headers });
}

function getOAuthSessionCookie(headers: Headers) {
  return getCookies(headers)[OAUTH_COOKIE_NAME];
}

async function getOAuthSession(id: string) {
  const res = await kv.get<OAuthSession>(["oauth-sessions", id]);
  return res.value;
}

async function deleteOAuthSession(id: string) {
  await kv.delete(["oauth-sessions", id]);
}

export async function setUserWithSession(user: User, session: string) {
  await kv.atomic()
    .set(["users", user.id], user)
    .set(["users_by_login", user.login], user)
    .set(["users_by_session", session], user)
    .commit();
}

export async function handleOAuthCallback(request: Request) {
  const oauthSessionCookie = getOAuthSessionCookie(request.headers);

  if (!oauthSessionCookie) {
    throw new Error();
  }

  const oauthSession = await getOAuthSession(oauthSessionCookie);
  await deleteOAuthSession(oauthSessionCookie);

  if (!oauthSession) {
    throw new Error();
  }

  const tokens = await oauth2Client.code.getToken(request.url, oauthSession);
  const user = await getUser(tokens.accessToken);
  const session = crypto.randomUUID();
  await setUserWithSession(user, session);

  const resp = new Response("Logged in", {
    headers: {
      Location: "/",
    },
    status: 307,
  });
  deleteCookie(resp.headers, "oauth-session");
  setCookie(resp.headers, {
    name: "session",
    value: session,
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });
  return resp;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
}

interface User {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
}

async function getUser(accessToken: string): Promise<User> {
  const response = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error();
  }
  const data = await response.json() as GitHubUser;
  return {
    id: data.id.toString(),
    login: data.login,
    name: data.name,
    avatarUrl: data.avatar_url,
  };
}

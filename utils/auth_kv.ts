import { deleteCookie, getCookies, setCookie } from "std/http/cookie.ts";
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.0/mod.ts";
import { kv } from "./db.ts";
import { redirect } from "./http.ts";

const OAUTH_SESSION_COOKIE_NAME = "oauth-session";

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

export async function redirectToOAuthLogin() {
  // Generate a random state
  const state = crypto.randomUUID();
  const { uri, codeVerifier } = await oauth2Client.code
    .getAuthorizationUri({ state });

  // Associate the state and PKCE code verifier with a session cookie
  const oauthSessionId = crypto.randomUUID();
  await kv.set(["oauth_sessions", oauthSessionId], { state, codeVerifier });

  const headers = new Headers({ location: uri.toString() });
  setCookie(headers, {
    name: OAUTH_SESSION_COOKIE_NAME,
    value: oauthSessionId,
    httpOnly: true,
  });

  // Redirect to the authorization endpoint
  return new Response(null, { status: 302, headers });
}

export async function handleOAuthCallback(request: Request) {
  const oauthSessionCookie =
    getCookies(request.headers)[OAUTH_SESSION_COOKIE_NAME];

  if (!oauthSessionCookie) {
    throw new Error();
  }

  const oauthSessionRes = await kv.get<OAuthSession>([
    "oauth-sessions",
    oauthSessionCookie,
  ]);
  const oauthSession = oauthSessionRes.value;
  await await kv.delete(["oauth-sessions", oauthSessionCookie]);

  if (!oauthSession) {
    throw new Error();
  }

  const tokens = await oauth2Client.code.getToken(request.url, oauthSession);
  const user = await getUser(tokens.accessToken);
  const sessionId = crypto.randomUUID();

  await kv.atomic()
    .set(["users", user.id], user)
    .set(["users_by_login", user.login], user)
    .set(["users_by_session", sessionId], user)
    .commit();

  const response = redirect("/");
  deleteCookie(response.headers, "oauth-session");
  setCookie(response.headers, {
    name: "session",
    value: sessionId,
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
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

export async function signout() {}

export async function getSessionUser() {}

export async function isSignedIn() {}

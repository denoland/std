// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { deleteCookie, getCookies, setCookie } from "std/http/cookie.ts";
import { OAuth2Client } from "oauth2_client/mod.ts";
import { assert } from "https://deno.land/std@0.178.0/_util/asserts.ts";

const OAUTH_SESSION_COOKIE_NAME = "oauth-session";
const OAUTH_SESSION_KV_PREFIX = "oauth-sessions";
const SITE_SESSION_COOKIE_NAME = "session";

interface OAuthSession {
  state: string;
  codeVerifier: string;
}

const kv = await Deno.openKv();

async function setOAuthSession(
  oauthSessionId: string,
  oauthSession: OAuthSession,
) {
  await kv.set([OAUTH_SESSION_KV_PREFIX, oauthSessionId], oauthSession);
}

async function getOAuthSession(oauthSessionId: string) {
  const res = await kv.get<OAuthSession>([
    OAUTH_SESSION_KV_PREFIX,
    oauthSessionId,
  ]);
  return res.value;
}

async function deleteOAuthSession(oauthSessionId: string) {
  await kv.delete([OAUTH_SESSION_KV_PREFIX, oauthSessionId]);
}

function setOAuthSessionCookie(headers: Headers, oauthSessionId: string) {
  setCookie(headers, {
    name: OAUTH_SESSION_COOKIE_NAME,
    value: oauthSessionId,
  });
}

function getOAuthSessionCookie(headers: Headers) {
  return getCookies(headers)[OAUTH_SESSION_COOKIE_NAME];
}

function deleteOAuthSessionCookie(headers: Headers) {
  deleteCookie(headers, OAUTH_SESSION_COOKIE_NAME);
}

export async function redirectToOAuthLogin(oauth2Client: OAuth2Client) {
  // Generate a random state
  const state = crypto.randomUUID();
  const { uri, codeVerifier } = await oauth2Client.code.getAuthorizationUri({
    state,
  });

  // Store the state and PKCE code verifier server-side in Deno KV
  const oauthSessionId = crypto.randomUUID();
  await setOAuthSession(oauthSessionId, {
    state,
    codeVerifier,
  });

  // Store the state and PKCE code verifier client-side in a session cookie
  const headers = new Headers({ location: uri.toString() });
  setOAuthSessionCookie(headers, oauthSessionId);

  // Redirect to the authorization endpoint
  return new Response(null, { status: 302, headers });
}

export async function getAccessToken(
  request: Request,
  oauth2Client: OAuth2Client,
) {
  const oauthSessionId = getOAuthSessionCookie(request.headers);
  assert(oauthSessionId, `Cookie ${OAUTH_SESSION_COOKIE_NAME} not found`);

  const oauthSession = await getOAuthSession(oauthSessionId);
  assert(oauthSession, `OAuth session ${oauthSessionId} entry not found`);
  await deleteOAuthSession(oauthSessionId);

  const tokens = await oauth2Client.code.getToken(request.url, oauthSession);
  return tokens.accessToken;
}

function setSessionCookie(headers: Headers, sessionId: string) {
  setCookie(headers, {
    name: SITE_SESSION_COOKIE_NAME,
    value: sessionId,
  });
}

function getSessionCookie(headers: Headers) {
  return getCookies(headers)[SITE_SESSION_COOKIE_NAME];
}

export function getSessionId(headers: Headers) {
  return getSessionCookie(headers) || undefined;
}

export function deleteSessionCookie(headers: Headers) {
  deleteCookie(headers, SITE_SESSION_COOKIE_NAME);
}

export function setCallbackHeaders(headers: Headers, sessionId: string) {
  deleteOAuthSessionCookie(headers);
  setSessionCookie(headers, sessionId);
}

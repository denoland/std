// Copyright 2018-2026 the Deno authors. MIT license.
import { type Route, routeLinear, routeRadix } from "./unstable_route.ts";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function defaultHandler(_req: Request) {
  return new Response("Not Found", { status: 404 });
}

function noop() {
  return new Response("ok");
}

// ---------------------------------------------------------------------------
// Route tables
// ---------------------------------------------------------------------------

// Small table (5 routes) — static-only
const smallStaticRoutes: Route[] = [
  { pattern: new URLPattern({ pathname: "/" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/about" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/contact" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/blog" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/faq" }), handler: noop },
];

// Large table (20 routes) — static-only
const largeStaticRoutes: Route[] = [
  { pattern: new URLPattern({ pathname: "/" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/about" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/contact" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/blog" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/faq" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/pricing" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/terms" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/privacy" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/login" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/signup" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/dashboard" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/settings" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/profile" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/search" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/help" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/status" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/changelog" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/docs" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/api" }), handler: noop },
  { pattern: new URLPattern({ pathname: "/health" }), handler: noop },
];

// Mixed table — static + parametric + wildcard (realistic API router shape)
const mixedRoutes: Route[] = [
  { pattern: new URLPattern({ pathname: "/health" }), handler: noop },
  {
    pattern: new URLPattern({ pathname: "/users" }),
    method: "GET",
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/users" }),
    method: "POST",
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/users/:id" }),
    method: "GET",
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/users/:id" }),
    method: "PUT",
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/users/:id" }),
    method: "DELETE",
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/posts" }),
    method: "GET",
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/posts/:id" }),
    method: "GET",
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/posts/:id/comments" }),
    method: "GET",
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/posts/:id/comments/:cid" }),
    method: "GET",
    handler: noop,
  },
  { pattern: new URLPattern({ pathname: "/static/*" }), handler: noop },
];

// Complex/fallback patterns — regex constraint, optional group, inline wildcard
const complexRoutes: Route[] = [
  {
    pattern: new URLPattern({ pathname: "/books/:id(\\d+)" }),
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/books/:slug" }),
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/file{.:ext}?" }),
    handler: noop,
  },
  {
    pattern: new URLPattern({ pathname: "/static/*.js" }),
    handler: noop,
  },
];

// ---------------------------------------------------------------------------
// Pre-built handlers (setup cost excluded from bench fn)
// ---------------------------------------------------------------------------

const smallStaticHandlerLinear = routeLinear(smallStaticRoutes, defaultHandler);
const largeStaticHandlerLinear = routeLinear(largeStaticRoutes, defaultHandler);
const mixedHandlerLinear = routeLinear(mixedRoutes, defaultHandler);
const complexHandlerLinear = routeLinear(complexRoutes, defaultHandler);

const smallStaticHandlerRadix = routeRadix(smallStaticRoutes, defaultHandler);
const largeStaticHandlerRadix = routeRadix(largeStaticRoutes, defaultHandler);
const mixedHandlerRadix = routeRadix(mixedRoutes, defaultHandler);
const complexHandlerRadix = routeRadix(complexRoutes, defaultHandler);

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

// Static — first route in table
const reqStaticFirst = new Request("http://example.com/");
// Static — last route in small table
const reqStaticLastSmall = new Request("http://example.com/faq");
// Static — last route in large table
const reqStaticLastLarge = new Request("http://example.com/health");
// Static — miss (no match)
const reqStaticMiss = new Request("http://example.com/not-found");

// Parametric — single param
const reqParam = new Request("http://example.com/users/42");
// Parametric — two params (shallow nesting)
const reqParamDeep = new Request("http://example.com/posts/7/comments/3");
// Parametric — miss (method mismatch on all matching routes)
const reqParamMethodMiss = new Request("http://example.com/users/42", {
  method: "PATCH",
});

// Wildcard
const reqWildcard = new Request("http://example.com/static/assets/logo.png");

// Complex patterns
const reqComplexRegex = new Request("http://example.com/books/123");
const reqComplexOptional = new Request("http://example.com/file.ts");
const reqComplexInlineWildcard = new Request(
  "http://example.com/static/app.js",
);

// ---------------------------------------------------------------------------
// Benchmarks — static routes
// ---------------------------------------------------------------------------

Deno.bench({
  group: "static route — first in small table",
  name: "linear",
  baseline: true,
  async fn() {
    await smallStaticHandlerLinear(reqStaticFirst);
  },
});

Deno.bench({
  group: "static route — first in small table",
  name: "radix",
  async fn() {
    await smallStaticHandlerRadix(reqStaticFirst);
  },
});

Deno.bench({
  group: "static route — last in small table",
  name: "linear",
  baseline: true,
  async fn() {
    await smallStaticHandlerLinear(reqStaticLastSmall);
  },
});

Deno.bench({
  group: "static route — last in small table",
  name: "radix",
  async fn() {
    await smallStaticHandlerRadix(reqStaticLastSmall);
  },
});

Deno.bench({
  group: "static route — last in large table",
  name: "linear",
  baseline: true,
  async fn() {
    await largeStaticHandlerLinear(reqStaticLastLarge);
  },
});

Deno.bench({
  group: "static route — last in large table",
  name: "radix",
  async fn() {
    await largeStaticHandlerRadix(reqStaticLastLarge);
  },
});

Deno.bench({
  group: "static route — miss (small table)",
  name: "linear",
  baseline: true,
  async fn() {
    await smallStaticHandlerLinear(reqStaticMiss);
  },
});

Deno.bench({
  group: "static route — miss (small table)",
  name: "radix",
  async fn() {
    await smallStaticHandlerRadix(reqStaticMiss);
  },
});

Deno.bench({
  group: "static route — miss (large table)",
  name: "linear",
  baseline: true,
  async fn() {
    await largeStaticHandlerLinear(reqStaticMiss);
  },
});

Deno.bench({
  group: "static route — miss (large table)",
  name: "radix",
  async fn() {
    await largeStaticHandlerRadix(reqStaticMiss);
  },
});

// ---------------------------------------------------------------------------
// Benchmarks — parametric routes
// ---------------------------------------------------------------------------

Deno.bench({
  group: "parametric route — single param",
  name: "linear",
  baseline: true,
  async fn() {
    await mixedHandlerLinear(reqParam);
  },
});

Deno.bench({
  group: "parametric route — single param",
  name: "radix",
  async fn() {
    await mixedHandlerRadix(reqParam);
  },
});

Deno.bench({
  group: "parametric route — two params (nested)",
  name: "linear",
  baseline: true,
  async fn() {
    await mixedHandlerLinear(reqParamDeep);
  },
});

Deno.bench({
  group: "parametric route — two params (nested)",
  name: "radix",
  async fn() {
    await mixedHandlerRadix(reqParamDeep);
  },
});

Deno.bench({
  group: "parametric route — method mismatch",
  name: "linear",
  baseline: true,
  async fn() {
    await mixedHandlerLinear(reqParamMethodMiss);
  },
});

Deno.bench({
  group: "parametric route — method mismatch",
  name: "radix",
  async fn() {
    await mixedHandlerRadix(reqParamMethodMiss);
  },
});

// ---------------------------------------------------------------------------
// Benchmarks — wildcard routes
// ---------------------------------------------------------------------------

Deno.bench({
  group: "wildcard route",
  name: "linear",
  baseline: true,
  async fn() {
    await mixedHandlerLinear(reqWildcard);
  },
});

Deno.bench({
  group: "wildcard route",
  name: "radix",
  async fn() {
    await mixedHandlerRadix(reqWildcard);
  },
});

// ---------------------------------------------------------------------------
// Benchmarks — complex/fallback patterns
// ---------------------------------------------------------------------------

Deno.bench({
  group: "complex — regex constraint",
  name: "linear",
  baseline: true,
  async fn() {
    await complexHandlerLinear(reqComplexRegex);
  },
});

Deno.bench({
  group: "complex — regex constraint",
  name: "radix",
  async fn() {
    await complexHandlerRadix(reqComplexRegex);
  },
});

Deno.bench({
  group: "complex — optional group",
  name: "linear",
  baseline: true,
  async fn() {
    await complexHandlerLinear(reqComplexOptional);
  },
});

Deno.bench({
  group: "complex — optional group",
  name: "radix",
  async fn() {
    await complexHandlerRadix(reqComplexOptional);
  },
});

Deno.bench({
  group: "complex — inline wildcard with suffix",
  name: "linear",
  baseline: true,
  async fn() {
    await complexHandlerLinear(reqComplexInlineWildcard);
  },
});

Deno.bench({
  group: "complex — inline wildcard with suffix",
  name: "radix",
  async fn() {
    await complexHandlerRadix(reqComplexInlineWildcard);
  },
});

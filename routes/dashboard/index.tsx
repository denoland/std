// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { redirect } from "@/utils/http.ts";

// deno-lint-ignore require-await
export default async function DashboardPage() {
  return redirect("/dashboard/stats");
}

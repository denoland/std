// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { createGitHubOAuth2Client } from "kv_oauth";

export const oauth2Client = createGitHubOAuth2Client();

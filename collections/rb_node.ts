// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/** This module is browser compatible. */

import { direction } from "./bs_node.ts";
import { RedBlackNode } from "./red_black_node.ts";
export type { direction };

/** @deprecated use RedBlackNode instead */
export { RedBlackNode as BSNode };

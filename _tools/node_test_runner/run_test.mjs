// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { test } from "node:test";

import "../../collections/aggregate_groups_test.ts";
import "../../collections/associate_by_test.ts";
import "../../collections/associate_with_test.ts";
import "../../collections/chunk_test.ts";
import "../../collections/deep_merge_test.ts";
import "../../collections/distinct_by_test.ts";
import "../../collections/distinct_test.ts";
import "../../collections/drop_last_while_test.ts";
import "../../collections/drop_while_test.ts";
import "../../collections/filter_entries_test.ts";
import "../../collections/filter_keys_test.ts";
import "../../collections/filter_values_test.ts";
import "../../collections/find_single_test.ts";
import "../../collections/first_not_nullish_of_test.ts";
import "../../collections/includes_value_test.ts";
import "../../collections/intersect_test.ts";
import "../../collections/invert_by_test.ts";
// TODO(kt3k): Enable this
// import "../../collections/invert_test.ts";
import "../../collections/join_to_string_test.ts";
import "../../collections/map_entries_test.ts";
import "../../collections/map_keys_test.ts";
import "../../collections/map_not_nullish_test.ts";
import "../../collections/map_values_test.ts";
import "../../collections/max_by_test.ts";
import "../../collections/max_of_test.ts";
import "../../collections/max_with_test.ts";
import "../../collections/min_by_test.ts";
import "../../collections/min_of_test.ts";
import "../../collections/min_with_test.ts";
import "../../collections/omit_test.ts";
import "../../collections/partition_entries_test.ts";
import "../../collections/partition_test.ts";
import "../../collections/permutations_test.ts";
import "../../collections/pick_test.ts";
import "../../collections/reduce_groups_test.ts";
import "../../collections/running_reduce_test.ts";
import "../../collections/sample_test.ts";
import "../../collections/sliding_windows.ts";
import "../../collections/sort_by_test.ts";
import "../../collections/sum_of_test.ts";
import "../../collections/take_last_while_test.ts";
import "../../collections/take_while_test.ts";
import "../../collections/union_test.ts";
import "../../collections/unzip_test.ts";
import "../../collections/without_all_test.ts";
import "../../collections/zip_test.ts";

for (const testDef of testDefinitions) {
  test(testDef.name, testDef.fn);
}

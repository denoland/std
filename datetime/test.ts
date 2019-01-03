import { test, assertEqual } from "../testing/mod.ts";
import * as datetime from "mod.ts"

test(function parseDateTime() {
  assertEqual(datetime.parseDateTime("01-03-2019 16:34", "mm-dd-yyyy hh:mm"), new Date(2019, 1, 3, 16, 34));
});
test(function parseDate() {
  assertEqual(datetime.parseDateTime("01-03-2019", "mm-dd-yyyy"), new Date(2019, 1, 3));
});

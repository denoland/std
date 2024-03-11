import { emptyDirSync } from "../empty_dir.ts";

try {
  emptyDirSync("fs/testdata/testfolder");
  console.log("success");
} catch (error) {
  console.log(error);
}

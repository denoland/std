// deno-lint-ignore-file no-console
import { emptyDir } from "../empty_dir.ts";

try {
  // Empty testfolder stored in Deno.args where the child.txt is located.
  await emptyDir(Deno.args[0]!);
  console.log("success");
} catch (error) {
  console.log(error);
}

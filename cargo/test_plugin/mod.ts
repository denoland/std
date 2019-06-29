import { build } from "../mod.ts";
import { join, dirname } from "../../fs/path/mod.ts";

const { openPlugin, pluginFilename } = Deno;

const manifest_path = join(dirname(import.meta.url), "Cargo.toml");
const buildResult = build({
  manifest_path
});
// We could also search through the artifacts list here to find something more specific if we wanted.
const plugin = openPlugin(
  join(buildResult.output_root, pluginFilename(buildResult.artifacts[0].output_name))
);
export const testOp = plugin.loadOp("test_op");

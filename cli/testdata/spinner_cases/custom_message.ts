import { Spinner } from "../../spinner.ts";

const spinner = new Spinner({ message: "Spinning with Deno 🦕" });

spinner.start();

setTimeout(spinner.stop, 100);

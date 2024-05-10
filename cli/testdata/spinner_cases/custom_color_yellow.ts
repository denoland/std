import { Spinner } from "../../spinner.ts";

const spinner = new Spinner({ color: "yellow" });

spinner.start();

setTimeout(spinner.stop, 100);

import { Spinner } from "../../spinner.ts";

const spinner = new Spinner({ color: "cyan" });

spinner.start();

setTimeout(spinner.stop, 100);

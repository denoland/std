import { Spinner } from "../../spinner.ts";

const spinner = new Spinner({ color: "red" });

spinner.start();

setTimeout(spinner.stop, 100);

import { Spinner } from "../../spinner.ts";

const spinner = new Spinner({ color: "white" });

spinner.start();

setTimeout(spinner.stop, 100);

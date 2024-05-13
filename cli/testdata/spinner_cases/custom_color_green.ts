import { Spinner } from "../../spinner.ts";

const spinner = new Spinner({ color: "green" });

spinner.start();

setTimeout(spinner.stop, 100);

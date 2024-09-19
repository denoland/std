import { Spinner } from "../../unstable_spinner.ts";

const spinner = new Spinner({ color: "magenta" });

spinner.start();

setTimeout(() => spinner.stop(), 100);

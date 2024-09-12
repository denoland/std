import { Spinner } from "../../unstable_spinner.ts";

const spinner = new Spinner({ color: "cyan" });

spinner.start();

setTimeout(() => spinner.stop(), 100);

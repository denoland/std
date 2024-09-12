import { Spinner } from "../../unstable_spinner.ts";

const spinner = new Spinner({ color: "red" });

spinner.start();

setTimeout(() => spinner.stop(), 100);

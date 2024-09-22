import { Spinner } from "../../unstable_spinner.ts";

const spinner = new Spinner({ color: "white" });

spinner.start();

setTimeout(() => spinner.stop(), 100);

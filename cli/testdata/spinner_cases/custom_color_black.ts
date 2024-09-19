import { Spinner } from "../../unstable_spinner.ts";

const spinner = new Spinner({ color: "black" });

spinner.start();

setTimeout(() => spinner.stop(), 100);

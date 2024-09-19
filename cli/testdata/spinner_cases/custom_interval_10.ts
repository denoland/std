import { Spinner } from "../../unstable_spinner.ts";

const spinner = new Spinner({ interval: 10 });

spinner.start();

setTimeout(() => spinner.stop(), 1000);

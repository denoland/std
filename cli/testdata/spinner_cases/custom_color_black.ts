import { Spinner } from "../../spinner.ts";

const spinner = new Spinner({ color: "black" });

spinner.start();

setTimeout(spinner.stop, 100);

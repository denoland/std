import { Spinner } from "../../spinner.ts";

const spinner = new Spinner({ color: "blue" });

spinner.start();

setTimeout(spinner.stop, 100);

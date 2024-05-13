import { Spinner } from "../../spinner.ts";

const spinner = new Spinner();

spinner.start();

setTimeout(spinner.stop, 200);

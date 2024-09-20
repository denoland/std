import { Spinner } from "../../unstable_spinner.ts";

const spinner = new Spinner();

spinner.start();

spinner.color = "black";
setTimeout(() => spinner.color = "red", 125); // 150

setTimeout(() => spinner.stop(), 350);

import { Spinner } from "../../unstable_spinner.ts";

const spinner = new Spinner();

spinner.start();

setTimeout(() => (spinner.message = "One dino 🦕"), 10);
setTimeout(() => (spinner.message = "Two dinos 🦕🦕"), 250);

setTimeout(() => spinner.stop(), 500);

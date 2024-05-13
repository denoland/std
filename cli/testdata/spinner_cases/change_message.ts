import { Spinner } from "../../spinner.ts";

const spinner = new Spinner();

spinner.start();

setTimeout(() => (spinner.message = "One dino 🦕"), 125); // 150
setTimeout(() => (spinner.message = "Two dinos 🦕🦕"), 200); // 225
setTimeout(() => (spinner.message = "Three dinos 🦕🦕🦕"), 275); // 300

setTimeout(spinner.stop, 350);

import { Spinner } from "../../spinner.ts";

const spinner = new Spinner({
  spinner: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
});

spinner.start();

setTimeout(spinner.stop, 1000);

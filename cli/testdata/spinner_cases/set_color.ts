import { Spinner } from "../../spinner.ts";

const spinner = new Spinner();

spinner.start();

spinner.color = "black";
setTimeout(() => spinner.color = "red", 125); // 150
setTimeout(() => spinner.color = "green", 200); // 225
setTimeout(() => spinner.color = "yellow", 275); // 300
setTimeout(() => spinner.color = "blue", 350); // 375
setTimeout(() => spinner.color = "magenta", 425); // 450
setTimeout(() => spinner.color = "cyan", 500); // 525
setTimeout(() => spinner.color = "white", 575); // 600
setTimeout(() => spinner.color = "gray", 650); // 675

setTimeout(spinner.stop, 700);

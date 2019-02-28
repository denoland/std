import { glob } from "./fs/glob.ts";

console.log(glob("unicorn.*"));
console.log([RegExp(/^unicorn\..*$/)]);
console.log(glob("unicorn.*")[0].toString() === RegExp(/^unicorn\..*$/).toString());
console.log(glob("*.ts"));
console.log([RegExp(/^.*\.ts$/)]);
console.log(glob("unicorn/in/the/cathedral.ts"));
console.log([RegExp(/^unicorn\/in\/the\/cathedral\.ts$/)]);
console.log(glob(""));
console.log([RegExp(/^$/)]);

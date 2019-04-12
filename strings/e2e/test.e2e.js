const puppeteer = require("puppeteer");
const assert = require("assert");
(async () => {
  // TODO (zekth) Fix chrome Path for all envs
  // const browser = await puppeteer.launch({
  //   headless: true,
  //   executablePath:
  //     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  // });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on("console", msg => logs.push(msg.text()));

  try {
    await page.goto("http://localhost:4500/strings/e2e/test.html");
    await page.waitFor(500);
    assert(logs[0] === "**deno");
    console.log("OK");
  } catch (e) {
    console.log("FAILED");
  }
  await browser.close();
})();

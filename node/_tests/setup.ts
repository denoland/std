import { gunzip } from "https://deno.land/x/compress@v0.3.6/gzip/gzip.ts";
import { Untar } from "../../archive/tar.ts";
import {
  basename,
  delimiter,
  fromFileUrl,
  resolve,
} from "../../path/mod.ts";
import { ensureFile } from "../../fs/ensure_file.ts";

const NODE_URL = "https://nodejs.org/dist/vNODE_VERSION";
const NODE_FILE = "node-vNODE_VERSION.tar.gz";
const FILE_FOLDER = "versions";
const TESTS_FOLDER = "parallel";

const config = JSON.parse(
  await Deno.readTextFile(new URL("./config.json", import.meta.url)),
);

/** URL for thw download */
const url = `${NODE_URL}/${NODE_FILE}`.replaceAll(
  "NODE_VERSION",
  config.nodeVersion,
);
/** Local url location */
const path = `./${FILE_FOLDER}/` +
  NODE_FILE.replaceAll("NODE_VERSION", config.nodeVersion);
/** Name of the folder inside the node archive */
const folder = NODE_FILE.replaceAll("NODE_VERSION", config.nodeVersion).replace(
  /.tar.gz$/,
  "",
);

/**
 * This will overwrite the file if found
 * */
async function downloadFile(url: string, path: string) {
  console.log(`Downloading: ${url}...`);
  const fileContent = await fetch(url)
    .then((response) => {
      if (response.ok) {
        if(!response.body){
          throw new Error(`The requested download url ${url} doesn't contain an archive to download`);
        }
        return response.body.getIterator();
      } else if (response.status === 404) {
        throw new Error(
          `The requested version ${config.nodeVersion} could not be found for download`,
        );
      }
      throw new Error(`Request failed with status ${response.status}`);
    });

  const filePath = fromFileUrl(new URL(path, import.meta.url));

  await ensureFile(filePath);
  const file = await Deno.open(filePath, {
    truncate: true,
    write: true,
  });
  for await (const chunk of fileContent) {
    await Deno.write(file.rid, chunk);
  }
  file.close();
  console.log(`Downloaded: ${url} into ${path}`);
}

async function clearTests() {
  console.log("Cleaning up previous tests");
  try {
    await Deno.remove(new URL(TESTS_FOLDER, import.meta.url), { recursive: true });
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      throw e;
    }
  }
}

/**
 * This reads the config files requested in the config file
 * and returns the folder they should be placed in
 * */
function getRequestedFileFolder(file: string) {
  for (const folder in config.files) {
    for (const regex of config.files[folder]) {
      if (new RegExp(regex).test(file)) {
        return folder;
      }
    }
  }
}

// TODO(Soremwar)
// This writes the file to disk in order to decompress it
// Converting it to Deno.Buffer should be more efficient
async function decompressTests(filePath: string) {
  console.log(`Processing ${basename(filePath)}...`);
  const compressedFile = await Deno.open(
    new URL(filePath, import.meta.url),
    { read: true },
  );

  const tmp = await Deno.makeTempFile();
  let decompressedFile = await Deno.open(tmp, { write: true });
  await Deno.writeAll(
    decompressedFile,
    gunzip(await Deno.readAll(compressedFile)),
  );
  Deno.close(compressedFile.rid);
  Deno.close(decompressedFile.rid);
  decompressedFile = await Deno.open(tmp, { read: true });

  const tar = new Untar(decompressedFile);

  for await (const entry of tar) {
    if (entry.type !== "file") continue;
    //This replaces the nested folder name in each entry
    //TODO
    //This might not be windows compatible
    const fileName = entry.fileName.replace(`${folder}${delimiter}`, "");
    const testFolder = getRequestedFileFolder(fileName);
    if (testFolder) {
      const path = resolve(
        fromFileUrl(new URL(TESTS_FOLDER, import.meta.url)),
        testFolder,
        basename(fileName),
      );
      await ensureFile(path);
      const file = await Deno.open(path, {
        create: true,
        truncate: true,
        write: true,
      });
      await Deno.copy(entry, file);
      Deno.close(file.rid);
    }
  }

  Deno.close(decompressedFile.rid);
  await Deno.remove(tmp);
}

let shouldDownload = false;
try {
  Deno.lstatSync(new URL(path, import.meta.url)).isFile;
  while (true) {
    const r = (prompt(`File "${path}" found, use file? Y/N:`) ?? "").trim()
      .toUpperCase();
    if (r === "Y") {
      break;
    } else if (r === "N") {
      shouldDownload = true;
      break;
    } else {
      console.log(`Unexpected: "${r}"`);
    }
  }
} catch (e) {
  if (!(e instanceof Deno.errors.NotFound)) {
    throw e;
  }
  shouldDownload = true;
}

if (shouldDownload) {
  console.log(`Downloading ${url} in path "${path}" ...`);
  await downloadFile(url, path);
}

await clearTests();

await decompressTests(path);

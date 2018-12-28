import { open, File } from "deno";
import { BaseHandler } from "../handler.ts";
import { LogLevel } from "../levels.ts";

export class FileHandler extends BaseHandler {
    private _file: File;

    async setup() {
        // TODO: filename should be taken from handler's config
        const filename = "./log.txt";
        // open file in append mode - write only
        this._file = await open(filename, 'a');
    }

    _log(level, ...args) {
        const encoder = new TextEncoder();
        const msg = encoder.encode(args[0] + '\n');
        this._file.write(msg);
    }
}

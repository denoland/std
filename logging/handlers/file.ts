import { open, File } from "deno";
import { BaseHandler } from "../handler.ts";

export class FileHandler extends BaseHandler {
    private _file: File;

    async setup() {
        // TODO: filename should be taken from handler's config
        const filename = "./log.txt";
        // open file in append mode - write only
        this._file = await open(filename, 'a');
    }

    log(msg: string) {
        const encoder = new TextEncoder();
        this._file.write(encoder.encode(msg));
    }
}

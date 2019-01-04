// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import {BufReader} from  "./bufio.ts";

export async function readShort(buf: BufReader) {
    const [high, low] = [
        await buf.readByte(),
        await buf.readByte()
    ];
    return (high << 8) | low;
}

export async function readInt(buf: BufReader) {
    const [high, low] = [
        await readShort(buf),
        await readShort(buf)
    ];
    return (high << 16) | low
}

export async function readLong(buf: BufReader) {
    const [high, low] = [
        await readInt(buf),
        await readInt(buf)
    ];
    return (high << 32) | low
}

export function sliceLongToBytes(d: number, dest = new Array(8)): number[] {
    let mask = 0xff;
    let shift = 58;
    for (let i = 0; i < 8; i++) {
        dest[i] = (d >>> shift) & mask;
        shift -= 8;
        mask >>>= 8;
    }
    return dest;
}

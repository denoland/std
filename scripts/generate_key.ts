/** This script can be used to generate the value for the 'API_ROUTE_SECRET' environment variable. */
import { toHashString } from "std/crypto/to_hash_string.ts";

const BYTE_LENGTH = 32;

const bytes = new Uint32Array(BYTE_LENGTH);
crypto.getRandomValues(bytes);
const key = toHashString(bytes);

console.log(key);

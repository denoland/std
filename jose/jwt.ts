import * as jws from "./jws.ts";
import { hasOwnProperty } from "./_util.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface ClaimsSet {
  iss?: string;
  sub?: string;
  aud?: string[] | string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}
export interface ClaimsSetOptions {
  exp?: { leeway: number };
  nbf?: { leeway: number };
  sub?: string;
  iss?: string;
  aud?: string[] | string;
}

function encodeClaimsSet(claimsSet: ClaimsSet) {
  return encoder.encode(JSON.stringify(claimsSet));
}
function decodeClaimsSet(encodedClaimsSet: Uint8Array) {
  return JSON.parse(decoder.decode(encodedClaimsSet));
}
export function checkClaimsSet(
  claimsSet: ClaimsSet,
  checkOptions: ClaimsSetOptions = {},
) {
  const options = {
    exp: { leeway: 0 },
    nbf: { leeway: 0 },
    ...checkOptions,
  };
  if (hasOwnProperty(claimsSet, "exp")) {
    const exp = claimsSet.exp;
    if (typeof exp !== "number") throw new Error(`exp must be a number`);
    if (exp + options.exp.leeway < Date.now() / 1000) {
      throw new Error(`exp claim check failed`);
    }
  }
  if (hasOwnProperty(claimsSet, "nbf")) {
    const nbf = claimsSet.nbf;
    if (typeof nbf !== "number") throw new Error(`nbf must be a number`);
    if (nbf + options.nbf.leeway > Date.now() / 1000) {
      throw new Error(`nbf claim check failed`);
    }
  }
  if (
    hasOwnProperty(options, "sub") &&
    claimsSet.sub !== options.sub
  ) {
    throw new Error(`iss claim check failed`);
  }
  if (
    hasOwnProperty(options, "iss") &&
    claimsSet.iss !== options.iss
  ) {
    throw new Error(`iss claim check failed`);
  }
  if (
    hasOwnProperty(options, "aud")
  ) {
    const claimSetAud: string[] = Array.isArray(claimsSet.aud)
      ? claimsSet.aud
      : [claimsSet.aud!];
    const optionsAud: string[] = Array.isArray(options.aud)
      ? options.aud
      : [options.aud!];
    if (!claimSetAud.some((a) => optionsAud.includes(a))) {
      throw new Error(`aud claim check failed`);
    }
  }
  return true;
}

export type Header = jws.ProtectedHeader;

export async function encode(
  { header, claimsSet }: { header: Header; claimsSet: ClaimsSet },
  key: CryptoKey | null,
) {
  return await jws.encodeCompactSerialization(
    { header, payload: encodeClaimsSet(claimsSet) },
    key,
  );
}
export async function decode(
  token: string,
  key: CryptoKey | null,
  checkOptions: ClaimsSetOptions = {},
) {
  const { header, payload } = await jws.decodeCompactSerialization(token, key);
  const claimsSet = decodeClaimsSet(payload);
  checkClaimsSet(claimsSet, checkOptions);
  return {
    header,
    claimsSet,
  };
}

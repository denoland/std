import * as base64url from "https://deno.land/std@0.101.0/encoding/base64url.ts";
import { Alg, getAlgorithm } from "./_util.ts";

export interface UnprotectedHeader {
  [key: string]: unknown;
}
export interface ProtectedHeader {
  alg: Alg;
  jku?: string;
  kid?: string;
  x5u?: string;
  x5c?: string;
  x5t?: string;
  "x5t#S256"?: string;
  typ?: string;
  cty?: string;
  crit?: string[];
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function checkKeyValidity(alg: Alg, key: CryptoKey | null): key is CryptoKey {
  if (alg === "none") {
    if (key) throw new Error(`alg '${alg}' does not allow a key`);
    return false;
  } else {
    if (!key) throw new Error(`alg '${alg}' demands a key`);
    const algorithm = getAlgorithm(alg);
    if (
      key.algorithm.name !== algorithm.name ||
      (key.algorithm as { hash?: { name: string } }).hash?.name !==
        algorithm.hash.name
    ) {
      throw Error(`key algorithm does not match with alg '${alg}'`);
    }
    return true;
  }
}

async function createSignature(
  protectedHeader: ProtectedHeader,
  signingInput: Uint8Array,
  key: CryptoKey,
) {
  return await crypto.subtle.sign(
    getAlgorithm(protectedHeader.alg),
    key,
    signingInput,
  );
}
async function checkSignature(
  signingInput: Uint8Array,
  protectedHeader: ProtectedHeader,
  signature: ArrayBuffer,
  key: CryptoKey,
) {
  const validSignature = await crypto.subtle.verify(
    getAlgorithm(protectedHeader.alg),
    key,
    signature,
    signingInput,
  );
  if (!validSignature) throw Error(`signature verification failed`);
}

function encodeSignature(signature: ArrayBuffer) {
  return base64url.encode(new Uint8Array(signature));
}
function decodeSignature(signature: string) {
  return base64url.decode(signature).buffer;
}

function encodeSigningInput(
  header: string,
  payload: string,
) {
  return (
    header +
    "." +
    payload
  );
}
function decodeSigningInput(
  signingInput: string,
) {
  const [encodedProtectedHeader, encodededPayload] = signingInput.split(".");
  return {
    header: decodeProtectedfHeader(encodedProtectedHeader),
    payload: base64url.decode(encodededPayload),
  };
}

export function encodeProtectedfHeader(protectedHeader: ProtectedHeader) {
  return base64url.encode(encoder.encode(JSON.stringify(protectedHeader)));
}
export function decodeProtectedfHeader(
  protectedHeader: string,
): ProtectedHeader {
  return JSON.parse(decoder.decode(base64url.decode(protectedHeader)));
}

function encodePayload(payload: Uint8Array) {
  return base64url.encode(payload);
}
function decodePayload(payload: string) {
  return base64url.decode(payload);
}

export async function encodeCompactSerialization(
  { header, payload }: { header: ProtectedHeader; payload: Uint8Array },
  key: CryptoKey | null,
) {
  let signature = "";
  const signingInput = encodeSigningInput(
    encodeProtectedfHeader(header),
    encodePayload(payload),
  );
  if (checkKeyValidity(header.alg, key)) {
    signature = encodeSignature(
      await createSignature(
        header,
        encoder.encode(signingInput),
        key,
      ),
    );
  }

  return (
    signingInput +
    "." +
    signature
  );
}
export async function decodeCompactSerialization(
  token: string,
  key: CryptoKey | null,
) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error(`jws malformed`);
  const [encodedProtectedHeader, encodedPayload, signature] = parts;
  const signingInput = encodedProtectedHeader + "." + encodedPayload;
  const { header, payload } = decodeSigningInput(signingInput);

  if (checkKeyValidity(header.alg, key)) {
    await checkSignature(
      encoder.encode(signingInput),
      header,
      decodeSignature(signature),
      key,
    );
  }

  return {
    header,
    payload,
  };
}

interface DecodedJsonFlattenedSerialization {
  payload: Uint8Array;
  protected: ProtectedHeader;
  header: UnprotectedHeader;
}
export async function encodeJsonFlattenedSerialization(
  { payload, protected: protectedHeader, header }:
    DecodedJsonFlattenedSerialization,
  key: CryptoKey | null,
): Promise<EncodedJsonFlattenedSerialization> {
  const joseHeader = {
    ...protectedHeader,
    ...header,
  };
  const signingInput = encodeSigningInput(
    encodeProtectedfHeader(joseHeader),
    encodePayload(payload),
  );
  let signature = "";
  if (checkKeyValidity(protectedHeader.alg, key)) {
    signature = encodeSignature(
      await createSignature(
        protectedHeader,
        encoder.encode(signingInput),
        key,
      ),
    );
  }
  return {
    payload: encodePayload(payload),
    protected: encodeProtectedfHeader(protectedHeader),
    header,
    signature: signature,
  };
}
interface EncodedJsonFlattenedSerialization {
  payload: string;
  protected: string;
  header: UnprotectedHeader;
  signature: string;
}
export async function decodeJsonFlattenedSerialization(
  data: EncodedJsonFlattenedSerialization,
  key: CryptoKey | null,
): Promise<DecodedJsonFlattenedSerialization> {
  const payload = decodePayload(data.payload);
  const protectedHeader = decodeProtectedfHeader(data.protected);
  const header = data.header;
  const signature = decodeSignature(data.signature);

  const joseHeader: ProtectedHeader = {
    ...protectedHeader,
    ...header,
  };
  const signingInput = encodeSigningInput(
    encodeProtectedfHeader(joseHeader),
    encodePayload(payload),
  );
  if (checkKeyValidity(protectedHeader.alg, key)) {
    await checkSignature(
      encoder.encode(signingInput),
      protectedHeader,
      signature,
      key,
    );
  }
  return {
    payload,
    protected: protectedHeader,
    header,
  };
}

interface DecodedSignature {
  protected: ProtectedHeader;
  header: UnprotectedHeader;
  signature: ArrayBuffer;
}
interface DecodedJsonGeneralSerialization {
  payload: Uint8Array;
  signatures: DecodedSignature[];
}
export async function encodeJsonGeneralSerialization(
  { payload, signatures }: DecodedJsonGeneralSerialization,
  key: CryptoKey | null,
): Promise<EncodedJsonGeneralSerialization> {
  const encodedSignatures = [];
  const encodedPayload = encodePayload(payload);
  for (const { protected: protectedHeader, header } of signatures) {
    let signature = "";
    const encodedProtectedHeader = encodeProtectedfHeader(protectedHeader);
    if (checkKeyValidity(protectedHeader.alg, key)) {
      const signingInput = encodeSigningInput(
        encodedProtectedHeader,
        encodedPayload,
      );
      signature = encodeSignature(
        await createSignature(
          protectedHeader,
          encoder.encode(signingInput),
          key,
        ),
      );
    }
    encodedSignatures.push({
      protected: encodedProtectedHeader,
      header,
      signature,
    });
  }

  return {
    payload: encodedPayload,
    signatures: encodedSignatures,
  };
}
interface EncodedSignature {
  protected: string;
  header: UnprotectedHeader;
  signature: string;
}
interface EncodedJsonGeneralSerialization {
  payload: string;
  signatures: EncodedSignature[];
}
export async function decodeJsonGeneralSerialization(
  { payload, signatures: encodedSignatures }: EncodedJsonGeneralSerialization,
  key: CryptoKey | null,
): Promise<DecodedJsonGeneralSerialization> {
  const signatures: DecodedSignature[] = [];
  for (
    const {
      protected: encodedProtectedHeader,
      header: unprotectedHeader,
      signature,
    } of encodedSignatures
  ) {
    const protectedHeader = decodeProtectedfHeader(encodedProtectedHeader);
    const signingInput = encodeSigningInput(
      encodedProtectedHeader,
      payload,
    );
    if (checkKeyValidity(protectedHeader.alg, key)) {
      await checkSignature(
        encoder.encode(signingInput),
        protectedHeader,
        decodeSignature(signature),
        key,
      );
    }
    signatures.push({
      protected: protectedHeader,
      header: unprotectedHeader,
      signature: decodeSignature(signature),
    });
  }
  return {
    payload: decodePayload(payload),
    signatures,
  };
}

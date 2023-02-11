import { sign } from "./sign.js";
import verify from "./verify.js";
import algorithms from "./algorithms.json" assert { type: "json" };
import { Buffer } from "../../../buffer.ts";
import { createHash } from "../../../crypto.ts";
import * as stream from "../../../stream.ts";
import { inherits } from "../../../util.ts";

Object.keys(algorithms).forEach(function (key) {
  algorithms[key].id = Buffer.from(algorithms[key].id, "hex");
  algorithms[key.toLowerCase()] = algorithms[key];
});

function Sign(algorithm) {
  stream.Writable.call(this);

  const data = algorithms[algorithm];
  console.log(algorithm);
  if (!data) throw new Error("Unknown message digest");

  this._hashType = data.hash;
  this._hash = createHash(data.hash);
  this._tag = data.id;
  this._signType = data.sign;
}
inherits(Sign, stream.Writable);

Sign.prototype._write = function _write(data, _, done) {
  this._hash.update(data);
  done();
};

Sign.prototype.update = function update(data, enc) {
  if (typeof data === "string") data = Buffer.from(data, enc);

  this._hash.update(data);
  return this;
};

Sign.prototype.sign = function signMethod(key, enc) {
  this.end();
  const hash = this._hash.digest();
  const sig = sign(hash, key, this._hashType, this._signType, this._tag);

  return enc ? sig.toString(enc) : sig;
};

function Verify(algorithm) {
  stream.Writable.call(this);

  const data = algorithms[algorithm];
  if (!data) throw new Error("Unknown message digest");

  this._hash = createHash(data.hash);
  this._tag = data.id;
  this._signType = data.sign;
}
inherits(Verify, stream.Writable);

Verify.prototype._write = function _write(data, _, done) {
  this._hash.update(data);
  done();
};

Verify.prototype.update = function update(data, enc) {
  if (typeof data === "string") data = Buffer.from(data, enc);

  this._hash.update(data);
  return this;
};

Verify.prototype.verify = function verifyMethod(key, sig, enc) {
  if (typeof sig === "string") sig = Buffer.from(sig, enc);

  this.end();
  const hash = this._hash.digest();
  return verify(sig, hash, key, this._signType, this._tag);
};

function createSign(algorithm) {
  return new Sign(algorithm);
}

function createVerify(algorithm) {
  return new Verify(algorithm);
}

export { createSign, createSign as Sign, createVerify, createVerify as Verify };

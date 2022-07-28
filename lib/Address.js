import { createHash } from 'crypto';
import bs58 from 'bs58';
import { Keccak } from 'sha3';

const ADDRESS_PREFIX = Buffer.from([0x41]);

export default class Address {
  #bytes;

  constructor(bytes) {
    if (bytes.length !== 20) {
      throw new TypeError('Invalid bytes length');
    }
    this.#bytes = bytes;
  }

  toHex(prefix = true) {
    return this.toBuffer(prefix).toString('hex');
  }

  toBuffer(prefix = false) {
    if (prefix) {
      return Buffer.concat([ADDRESS_PREFIX, this.#bytes]);
    }
    return this.#bytes;
  }

  toBase58Check() {
    const hash = createHash('sha256').update(this.toBuffer(true)).digest();
    const check = createHash('sha256').update(hash).digest().subarray(0, 4);
    return bs58.encode(Buffer.concat([this.toBuffer(true), check]));
  }

  static fromPublicKey(publicKey) {
    if (!Buffer.isBuffer(publicKey)) {
      throw new TypeError('publicKey must be a buffer');
    }
    if (publicKey.length !== 65) {
      throw new TypeError('Invalid public key length');
    }
    const hash = new Keccak(256).update(publicKey.subarray(1)).digest();
    return new Address(hash.subarray(12));
  }

  static fromBase58Check(address) {
    const decoded = Buffer.from(bs58.decode(address));
    if (decoded.length < 4) {
      throw new TypeError('Invalid address');
    }
    const hash = createHash('sha256').update(decoded.subarray(0, -4)).digest();
    const check = createHash('sha256').update(hash).digest().subarray(0, 4);
    if (!check.equals(decoded.subarray(-4))) {
      throw new TypeError('Invalid checksum');
    }
    if (decoded[0] !== ADDRESS_PREFIX[0]) {
      throw new TypeError(`Invalid prefix '${decoded[0]}'`);
    }
    return new Address(decoded.subarray(1, -4));
  }

  static fromHex(hex, prefix = true) {
    const bytes = Buffer.from(hex, 'hex');
    if (prefix) {
      if (bytes[0] !== ADDRESS_PREFIX[0]) {
        throw new TypeError(`Invalid prefix '${bytes[0]}'`);
      }
      return new Address(bytes.subarray(1));
    }
    return new Address(bytes);
  }

  static fromBuffer(bytes, prefix = true) {
    if (!Buffer.isBuffer(bytes)) {
      throw new TypeError('bytes must be a buffer');
    }
    if (prefix) {
      if (bytes.length !== 21) {
        throw new TypeError('Invalid bytes length');
      }
      if (bytes[0] !== ADDRESS_PREFIX[0]) {
        throw new TypeError(`Invalid prefix '${bytes[0]}'`);
      }
      return new Address(bytes.subarray(1));
    }
    if (bytes.length !== 20) {
      throw new TypeError('Invalid bytes length');
    }
    return new Address(bytes);
  }

  static isValid(address) {
    try {
      Address.fromBase58Check(address);
      return true;
    } catch {
      return false;
    }
  }

  equals(address) {
    return this.#bytes.equals(address.toBuffer(false));
  }
}

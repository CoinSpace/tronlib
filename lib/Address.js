import { concatBytes } from '@noble/hashes/utils';
import { keccak_256 as keccak } from '@noble/hashes/sha3';
import { sha256 } from '@noble/hashes/sha256';
import { base58check, hex } from '@scure/base';

const ADDRESS_PREFIX = new Uint8Array([0x41]);

export default class Address {
  #bytes;

  constructor(bytes) {
    if (bytes.length !== 20) {
      throw new TypeError('Invalid bytes length');
    }
    this.#bytes = bytes;
  }

  toHex(prefix = true) {
    return hex.encode(this.toBytes(prefix));
  }

  toBytes(prefix = false) {
    if (prefix) {
      return concatBytes(ADDRESS_PREFIX, this.#bytes);
    }
    return this.#bytes;
  }

  toBase58Check() {
    return base58check(sha256).encode(this.toBytes(true));
  }

  toJSON() {
    return this.toBase58Check();
  }

  toString() {
    return this.toBase58Check();
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toBase58Check();
  }

  static fromPublicKey(publicKey) {
    if (!(publicKey instanceof Uint8Array)) {
      throw new TypeError('publicKey must be must be Uint8Array or Buffer');
    }
    if (publicKey.length !== 65) {
      throw new TypeError('Invalid public key length');
    }
    const hash = keccak(publicKey.subarray(1));
    return new Address(hash.subarray(12));
  }

  static fromBase58Check(address) {
    const decoded = base58check(sha256).decode(address);
    if (decoded[0] !== ADDRESS_PREFIX[0]) {
      throw new TypeError(`Invalid prefix '${decoded[0]}'`);
    }
    return new Address(decoded.subarray(1));
  }

  static fromHex(data, prefix = true) {
    const bytes = hex.decode(data);
    if (prefix) {
      if (bytes[0] !== ADDRESS_PREFIX[0]) {
        throw new TypeError(`Invalid prefix '${bytes[0]}'`);
      }
      return new Address(bytes.subarray(1));
    }
    return new Address(bytes);
  }

  static fromBytes(bytes, prefix = true) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError('bytes must be Uint8Array or Buffer');
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
    return this.toString() === address.toString();
  }
}

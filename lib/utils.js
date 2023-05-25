import Address from './Address.js';
import { secp256k1 } from '@noble/curves/secp256k1';
import { bytesToNumberBE, concatBytes, equalBytes, hexToBytes, numberToBytesBE } from '@noble/curves/abstract/utils';

//const functionSelector = 'transfer(address,uint256)';
const TRANSFER_PREFIX = hexToBytes('a9059cbb');

export function isBigInt(num) {
  return typeof num === 'bigint';
}

// https://developers.tron.network/docs/parameter-encoding-and-decoding
export function encodeTRC20data(addressTo, amount = 0n) {
  if (!(addressTo instanceof Address)) {
    throw new TypeError('addressTo must be an address');
  }
  if (!isBigInt(amount)) {
    throw new TypeError('amount must be an integer');
  }
  return concatBytes(
    TRANSFER_PREFIX,
    hexToBytes(addressTo.toHex(false).padStart(32 * 2, '0')),
    numberToBytesBE(amount, 32)
  );
}

export function decodeTRC20data(data) {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError('data must be Uint8Array or Buffer');
  }
  if (data.length !== (4 + 32 + 32)) {
    throw new TypeError('Invalid data length');
  }
  if (!equalBytes(data.subarray(0, 4), TRANSFER_PREFIX)) {
    throw new TypeError('Invalid data prefix');
  }
  return {
    addressTo: Address.fromBytes(data.subarray(4 + 12, 4 + 32), false),
    amount: bytesToNumberBE(data.subarray(4 + 32)),
  };
}

export function getPublicKeyFromPrivateKey(privateKey) {
  return secp256k1.getPublicKey(privateKey, false);
}

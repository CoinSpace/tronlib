import elliptic from 'elliptic';
import Address from './Address.js';

//const functionSelector = 'transfer(address,uint256)';
const TRANSFER_PREFIX = Buffer.from('a9059cbb', 'hex');

// https://developers.tron.network/docs/parameter-encoding-and-decoding
export function encodeTRC20data(addressTo, amount = 0) {
  if (!(addressTo instanceof Address)) {
    throw new TypeError('addressTo must be an address');
  }
  if (!Number.isInteger(amount)) {
    throw new TypeError('amount must be an integer');
  }
  return Buffer.concat([
    TRANSFER_PREFIX,
    Buffer.from(addressTo.toHex(false).padStart(32 * 2, '0'), 'hex'),
    Buffer.from(amount.toString(16).padStart(32 * 2, '0'), 'hex'),
  ]);
}

export function decodeTRC20data(data) {
  if (!Buffer.isBuffer(data)) {
    throw new TypeError('data must be a buffer');
  }
  if (data.length !== (4 + 32 + 32)) {
    throw new TypeError('Invalid data length');
  }
  if (!data.subarray(0, 4).equals(TRANSFER_PREFIX)) {
    throw new TypeError('Invalid data prefix');
  }
  return {
    addressTo: Address.fromHex(data.subarray(4 + 12, 4 + 32), false),
    amount: parseInt(data.subarray(4 + 32).toString('hex'), 16),
  };
}

export function getPublicKeyFromPrivateKey(privateKey) {
  return Buffer.from(new elliptic.ec('secp256k1')
    .keyFromPrivate(privateKey, 'bytes')
    .getPublic()
    .encode('bytes', false));
}

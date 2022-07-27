import elliptic from 'elliptic';
import Address from './Address.js';

//const functionSelector = 'transfer(address,uint256)';
const TRANSFER_PREFIX = 'a9059cbb';

// https://developers.tron.network/docs/parameter-encoding-and-decoding
export function encodeTRC20data(addressTo, amount = 0) {
  return Buffer.from(TRANSFER_PREFIX
    + addressTo.toHex(false).padStart(32 * 2, '0')
    + amount.toString(16).padStart(32 * 2, '0'), 'hex');
}

export function decodeTRC20data(data) {
  if (data.length !== (8 + 64 + 64)) {
    throw new TypeError('Invalid data length');
  }
  if (!data.startsWith(TRANSFER_PREFIX)) {
    throw new TypeError('Invalid data prefix');
  }
  return {
    addressTo: Address.fromHex(data.substring(8 + 24, 8 + 64), false),
    amount: parseInt(data.substring(8 + 64), 16),
  };
}

export function getPublicKeyFromPrivateKey(privateKey) {
  return Buffer.from(new elliptic.ec('secp256k1')
    .keyFromPrivate(privateKey, 'bytes')
    .getPublic()
    .encode('bytes', false));
}

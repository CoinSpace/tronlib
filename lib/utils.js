//const functionSelector = 'transfer(address,uint256)';
const TRANSFER_PREFIX = 'a9059cbb';

// https://developers.tron.network/docs/parameter-encoding-and-decoding
export function encodeTRC20data(addressTo, amount = 0) {
  return Buffer.from(TRANSFER_PREFIX
    + addressTo.toHex(false).padStart(32 * 2, '0')
    + amount.toString(16).padStart(32 * 2, '0'), 'hex');
}
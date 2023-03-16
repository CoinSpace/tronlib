import assert from 'assert';
import { Address, decodeTRC20data, encodeTRC20data } from '../index.js';

// eslint-disable-next-line max-len
const DATA = 'a9059cbb0000000000000000000000002ed5dd8a98aea00ae32517742ea5289761b2710e0000000000000000000000000000000000000000000000000000000ba43b7400';

describe('utils', () => {
  describe('encodeTRC20data', () => {
    it('should encode TRC20 data', () => {
      const data = encodeTRC20data(Address.fromBase58Check('TEErHWcgccM38vkZuJyN9fDTpgJU2qQNKf'), 50000000000);
      assert.strictEqual(data.toString('hex'), DATA);
    });
  });

  describe('decodeTRC20data', () => {
    it('should decode TRC20 data', () => {
      const data = decodeTRC20data(Buffer.from(DATA, 'hex'));
      assert(Address.fromBase58Check('TEErHWcgccM38vkZuJyN9fDTpgJU2qQNKf').equals(data.addressTo));
      assert.strictEqual(data.amount, 50000000000);
    });
  });
});

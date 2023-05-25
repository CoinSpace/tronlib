import assert from 'assert/strict';
import { hex } from '@scure/base';
import { Address, decodeTRC20data, encodeTRC20data } from '../index.js';

// eslint-disable-next-line max-len
const DATA = hex.decode('a9059cbb0000000000000000000000002ed5dd8a98aea00ae32517742ea5289761b2710e0000000000000000000000000000000000000000000000000000000ba43b7400');

describe('utils', () => {
  describe('encodeTRC20data', () => {
    it('should encode TRC20 data', () => {
      const data = encodeTRC20data(Address.fromBase58Check('TEErHWcgccM38vkZuJyN9fDTpgJU2qQNKf'), 50000000000n);
      assert.deepEqual(data, DATA);
    });
  });

  describe('decodeTRC20data', () => {
    it('should decode TRC20 data', () => {
      const data = decodeTRC20data(DATA);
      assert(Address.fromBase58Check('TEErHWcgccM38vkZuJyN9fDTpgJU2qQNKf').equals(data.addressTo));
      assert.equal(data.amount, 50000000000n);
    });
  });
});

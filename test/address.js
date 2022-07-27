import assert from 'assert';
import { Address } from '../index.js';

// eslint-disable-next-line max-len
const PUBLIC_KEY = '040947751e3022ecf3016be03ec77ab0ce3c2662b4843898cb068d74f698ccc8ad75aa17564ae80a20bb044ee7a6d903e8e8df624b089c95d66a0570f051e5a05b';
const ADDRESS = '41cd2a3d9f938e13cd947ec05abc7fe734df8dd826';
const BYTES = '8840e6c55b9ada326d211d818c34a994aeced808';
const BASE58CHECK = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL';

describe('Address', () => {
  describe('constructor', () => {
    it('should create address', () => {
      new Address(Buffer.alloc(20, 0));
    });

    it('should throw invalid bytes length', () => {
      assert.throws(() => {
        new Address(Buffer.alloc(10, 0));
      }, {
        name: 'TypeError',
        message: 'Invalid bytes length',
      });
    });
  });

  describe('fromPublicKey', () => {
    it('should create address', () => {
      const address = Address.fromPublicKey(Buffer.from(PUBLIC_KEY, 'hex'));
      assert.strictEqual(address.toHex(), ADDRESS);
    });

    it('should throw invalid public key length', () => {
      assert.throws(() => {
        Address.fromPublicKey(Buffer.alloc(60, 0));
      }, {
        name: 'TypeError',
        message: 'Invalid public key length',
      });
    });
  });

  describe('toBase58Check', () => {
    it('should return base 58 check address', () => {
      const address = new Address(Buffer.from(BYTES, 'hex'));
      assert.strictEqual(address.toBase58Check(), BASE58CHECK);
    });
  });

  describe('fromBase58Check', () => {
    it('should create address', () => {
      const address = Address.fromBase58Check(BASE58CHECK);
      assert.strictEqual(address.toHex(false), BYTES);
    });
  });
});

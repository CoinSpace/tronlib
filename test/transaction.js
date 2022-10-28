import assert from 'assert';
import { Address, TransactionCapsule, getPublicKeyFromPrivateKey } from '../index.js';

const privateKey = Buffer.from('c85ef7d79691fe79573b1a7064c19c1a9819ebdbd1faaab1a8ec92344438aaf4', 'hex');
const addressFrom = Address.fromPublicKey(getPublicKeyFromPrivateKey(privateKey));
const addressTo = Address.fromBase58Check('TB5ZUGvtVmtuZhB3Vu3rw1p9UJZLa6f4q2');
const blockID = Buffer.from('0000000001b1e685272beb1a42cfa07bef04f2b3ea0eb344e582f1bf08a0f683', 'hex');
const blockNumber = 28436101;
const blockTimestamp = 1658924271000;

describe('TransactionCapsule', () => {
  it('should create valid TRX transaction', () => {
    const transaction = TransactionCapsule.createTransfer(addressFrom, addressTo, 42)
      .addRefs(blockID, blockNumber, blockTimestamp)
      .sign(Buffer.from(privateKey, 'hex'));
    const hex = transaction.serialize().toString('hex');
    // eslint-disable-next-line max-len
    assert.strictEqual(hex, '0a7c0a02e6852208272beb1a42cfa07b40f8b2f0fca3305a65080112610a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412300a1541cd2a3d9f938e13cd947ec05abc7fe734df8dd8261215410c2bb55b3acd8b6351b31ff211ee0f484688e5da182a12418de4927d258053e31b3383c15a11d6bf00b71c3fbbda2dfeb74364e22f489529b1a48f212bab107b34a99aaa96117e178aa30ed91bda704f5dd5fd494e7140e101');
  });

  it('should create valid Token transaction', () => {
    const token = Address.fromBase58Check('TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj');
    const transaction = TransactionCapsule.createTransferToken(token, addressFrom, addressTo, 42)
      .addRefs(blockID, blockNumber, blockTimestamp, 10000000)
      .sign(Buffer.from(privateKey, 'hex'));
    const hex = transaction.serialize().toString('hex');
    // eslint-disable-next-line max-len
    assert.strictEqual(hex, '0acc010a02e6852208272beb1a42cfa07b40f8b2f0fca3305aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541cd2a3d9f938e13cd947ec05abc7fe734df8dd826121541ea51342dabbb928ae1e576bd39eff8aaf070a8c62244a9059cbb0000000000000000000000000c2bb55b3acd8b6351b31ff211ee0f484688e5da000000000000000000000000000000000000000000000000000000000000002a900180ade20412414ec770c53f3521bf4f8a41a5deeb540419e981fe41acc0014caf883108dc5b77998bc831a9ee52dda8b1407ee4028d8c7641f680e592ec65fb31dde686abd80901');
  });

  it('should estimate TRX transaction size', () => {
    const size = TransactionCapsule.estimateTransferSize(42, 1100000);
    assert.strictEqual(size, 263);
  });

  it('should estimate Token transaction size', () => {
    const size = TransactionCapsule.estimateTransferTokenSize(42, 10000000);
    assert.strictEqual(size, 338);
  });
});

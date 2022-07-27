import { createHash } from 'crypto';
import elliptic from 'elliptic';
import { protocol } from './protocol.js';
import Address from './Address.js';
import { encodeTRC20data } from './utils.js';

// 5 min
const EXPIRATION = 5 * 60 * 1000;

export default class TransactionCapsule {
  #transaction = {
    rawData: {},
  };

  constructor(contract) {
    if (contract) {
      this.#transaction.rawData.contract = [contract];
    }
  }

  static createTransfer(addressFrom, addressTo, amount) {
    if (!(addressFrom instanceof Address)) {
      throw new TypeError('addressFrom must be an address');
    }
    if (!(addressTo instanceof Address)) {
      throw new TypeError('addressTo must be an address');
    }
    if (!Number.isInteger(amount)) {
      throw new TypeError('amount must be an integer');
    }
    const message = protocol.TransferContract.encode({
      ownerAddress: addressFrom.toBuffer(true),
      toAddress: addressTo.toBuffer(true),
      amount,
    }).finish();
    return new TransactionCapsule({
      type: protocol.Transaction.Contract.ContractType.TransferContract,
      parameter: {
        type_url: protocol.TransferContract.getTypeUrl(),
        value: message,
      },
    });
  }

  static createTransferToken(token, addressFrom, addressTo, amount) {
    if (!(token instanceof Address)) {
      throw new TypeError('token must be an address');
    }
    if (!(addressFrom instanceof Address)) {
      throw new TypeError('addressFrom must be an address');
    }
    if (!(addressTo instanceof Address)) {
      throw new TypeError('addressTo must be an address');
    }
    if (!Number.isInteger(amount)) {
      throw new TypeError('amount must be an integer');
    }
    const data = encodeTRC20data(addressTo, amount);
    const message = protocol.TriggerSmartContract.encode({
      ownerAddress: addressFrom.toBuffer(true),
      contractAddress: token.toBuffer(true),
      data,
    }).finish();
    return new TransactionCapsule({
      type: protocol.Transaction.Contract.ContractType.TriggerSmartContract,
      parameter: {
        type_url: protocol.TriggerSmartContract.getTypeUrl(),
        value: message,
      },
    });
  }

  addRefs(blockID, blockNumber, blockTimestamp, feeLimit) {
    if (!Buffer.isBuffer(blockID)) {
      throw new TypeError('blockID must be a buffer');
    }
    if (!Number.isInteger(blockNumber)) {
      throw new TypeError('blockNumber must be an integer');
    }
    if (!Number.isInteger(blockTimestamp)) {
      throw new TypeError('blockTimestamp must be an integer');
    }
    if (feeLimit && !Number.isInteger(feeLimit)) {
      throw new TypeError('feeLimit must be an integer');
    }
    this.#transaction.rawData.refBlockBytes = Buffer
      .from(blockNumber.toString(16).padStart(8 * 2, '0'), 'hex')
      .subarray(6, 8);
    this.#transaction.rawData.refBlockHash = blockID.subarray(8, 16);
    this.#transaction.rawData.expiration = blockTimestamp + EXPIRATION;
    if (feeLimit) {
      this.#transaction.rawData.feeLimit = feeLimit;
    }
    return this;
  }

  sign(privateKey) {
    if (!Buffer.isBuffer(privateKey)) {
      throw new TypeError('privateKey must be a buffer');
    }
    const raw = protocol.Transaction.raw.encode(this.#transaction.rawData).finish();
    const hash = createHash('sha256').update(raw).digest();
    const signature = new elliptic.ec('secp256k1')
      .keyFromPrivate(privateKey, 'bytes')
      .sign(hash);
    this.#transaction.signature = [Buffer.concat([
      signature.r.toBuffer('be', 32),
      signature.s.toBuffer('be', 32),
      Buffer.from([signature.recoveryParam]),
    ])];
    return this;
  }

  serialize() {
    return protocol.Transaction.encode(this.#transaction).finish();
  }

  toObject() {
    return protocol.Transaction.toObject(this.#transaction);
  }
}

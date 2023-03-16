import Address from './Address.js';
import { createHash } from 'crypto';
import elliptic from 'elliptic';
import { encodeTRC20data } from './utils.js';
import { protocol } from './protocol.js';

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

  static estimateTransferSize(amount, feeLimit) {
    if (!Number.isInteger(amount)) {
      throw new TypeError('amount must be an integer');
    }
    if (feeLimit && !Number.isInteger(feeLimit)) {
      throw new TypeError('feeLimit must be an integer');
    }
    const message = protocol.TransferContract.encode({
      ownerAddress: Buffer.allocUnsafe(21),
      toAddress: Buffer.allocUnsafe(21),
      amount,
    }).finish();
    const transaction = {
      rawData: {
        contract: [{
          type: protocol.Transaction.Contract.ContractType.TransferContract,
          parameter: {
            type_url: protocol.TransferContract.getTypeUrl(),
            value: message,
          },
        }],
      },
    };
    transaction.rawData.refBlockBytes = Buffer.allocUnsafe(2);
    transaction.rawData.refBlockHash = Buffer.allocUnsafe(8);
    transaction.rawData.expiration = Date.now() + EXPIRATION;
    if (feeLimit) {
      transaction.rawData.feeLimit = feeLimit;
    }
    transaction.signature = [Buffer.allocUnsafe(65)];
    // https://stackoverflow.com/questions/67172564/how-to-estimate-trc20-token-transfer-gas-fee/73222761#73222761
    return Buffer.from(protocol.Transaction.encode(transaction).finish()).length + 64;
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

  static estimateTransferTokenSize(amount, feeLimit) {
    if (!Number.isInteger(amount)) {
      throw new TypeError('amount must be an integer');
    }
    if (feeLimit && !Number.isInteger(feeLimit)) {
      throw new TypeError('feeLimit must be an integer');
    }
    const message = protocol.TriggerSmartContract.encode({
      ownerAddress: Buffer.allocUnsafe(21),
      contractAddress: Buffer.allocUnsafe(21),
      data: Buffer.allocUnsafe(68),
    }).finish();
    const transaction = {
      rawData: {
        contract: [{
          type: protocol.Transaction.Contract.ContractType.TriggerSmartContract,
          parameter: {
            type_url: protocol.TriggerSmartContract.getTypeUrl(),
            value: message,
          },
        }],
      },
    };
    transaction.rawData.refBlockBytes = Buffer.allocUnsafe(2);
    transaction.rawData.refBlockHash = Buffer.allocUnsafe(8);
    transaction.rawData.expiration = Date.now() + EXPIRATION;
    if (feeLimit) {
      transaction.rawData.feeLimit = feeLimit;
    }
    transaction.signature = [Buffer.allocUnsafe(65)];
    // https://stackoverflow.com/questions/67172564/how-to-estimate-trc20-token-transfer-gas-fee/73222761#73222761
    return Buffer.from(protocol.Transaction.encode(transaction).finish()).length + 64;
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
      signature.r.toArrayLike(Buffer, 'be', 32),
      signature.s.toArrayLike(Buffer, 'be', 32),
      Buffer.from([signature.recoveryParam]),
    ])];
    return this;
  }

  serialize() {
    return Buffer.from(protocol.Transaction.encode(this.#transaction).finish());
  }

  toObject() {
    return protocol.Transaction.toObject(this.#transaction);
  }
}

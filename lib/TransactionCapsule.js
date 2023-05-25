import Address from './Address.js';
import { protocol } from './protocol.js';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { concatBytes, numberToBytesBE } from '@noble/curves/abstract/utils';
import { encodeTRC20data, isBigInt } from './utils.js';

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
    if (!isBigInt(amount)) {
      throw new TypeError('amount must be BigInt');
    }
    const message = protocol.TransferContract.encode({
      ownerAddress: addressFrom.toBytes(true),
      toAddress: addressTo.toBytes(true),
      // TODO move to BigInt
      // https://github.com/protobufjs/protobuf.js/pull/1557
      amount: Number(amount),
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
    if (!isBigInt(amount)) {
      throw new TypeError('amount must be BigInt');
    }
    if (feeLimit && !isBigInt(feeLimit)) {
      throw new TypeError('feeLimit must be BigInt');
    }
    const message = protocol.TransferContract.encode({
      ownerAddress: new Uint8Array(21),
      toAddress: new Uint8Array(21),
      // TODO move to BigInt
      amount: Number(amount),
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
    transaction.rawData.refBlockBytes = new Uint8Array(2);
    transaction.rawData.refBlockHash = new Uint8Array(8);
    transaction.rawData.expiration = Date.now() + EXPIRATION;
    if (feeLimit) {
      // TODO move to BigInt
      transaction.rawData.feeLimit = Number(feeLimit);
    }
    transaction.signature = [new Uint8Array(65)];
    // https://stackoverflow.com/questions/67172564/how-to-estimate-trc20-token-transfer-gas-fee/73222761#73222761
    return protocol.Transaction.encode(transaction).finish().length + 64;
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
    if (!isBigInt(amount)) {
      throw new TypeError('amount must be BigInt');
    }
    const data = encodeTRC20data(addressTo, amount);
    const message = protocol.TriggerSmartContract.encode({
      ownerAddress: addressFrom.toBytes(true),
      contractAddress: token.toBytes(true),
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
    if (!isBigInt(amount)) {
      throw new TypeError('amount must be BigInt');
    }
    if (feeLimit && !isBigInt(feeLimit)) {
      throw new TypeError('feeLimit must be BigInt');
    }
    const message = protocol.TriggerSmartContract.encode({
      ownerAddress: new Uint8Array(21),
      contractAddress: new Uint8Array(21),
      data: new Uint8Array(68),
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
    transaction.rawData.refBlockBytes = new Uint8Array(2);
    transaction.rawData.refBlockHash = new Uint8Array(8);
    transaction.rawData.expiration = Date.now() + EXPIRATION;
    if (feeLimit) {
      // TODO move to BigInt
      transaction.rawData.feeLimit = Number(feeLimit);
    }
    transaction.signature = [new Uint8Array(65)];
    // https://stackoverflow.com/questions/67172564/how-to-estimate-trc20-token-transfer-gas-fee/73222761#73222761
    return protocol.Transaction.encode(transaction).finish().length + 64;
  }

  addRefs(blockID, blockNumber, blockTimestamp, feeLimit) {
    if (!(blockID instanceof Uint8Array)) {
      throw new TypeError('blockID must be Uint8Array or Buffer');
    }
    if (!Number.isInteger(blockNumber)) {
      throw new TypeError('blockNumber must be an integer');
    }
    if (!Number.isInteger(blockTimestamp)) {
      throw new TypeError('blockTimestamp must be an integer');
    }
    if (feeLimit && !isBigInt(feeLimit)) {
      throw new TypeError('feeLimit must be BigInt');
    }
    this.#transaction.rawData.refBlockBytes = numberToBytesBE(blockNumber, 8).subarray(6, 8);
    this.#transaction.rawData.refBlockHash = blockID.subarray(8, 16);
    this.#transaction.rawData.expiration = blockTimestamp + EXPIRATION;
    if (feeLimit) {
      // TODO move to BigInt
      this.#transaction.rawData.feeLimit = Number(feeLimit);
    }
    return this;
  }

  sign(privateKey) {
    if (!(privateKey instanceof Uint8Array)) {
      throw new TypeError('privateKey must be Uint8Array or Buffer');
    }
    const raw = protocol.Transaction.raw.encode(this.#transaction.rawData).finish();
    const hash = sha256(raw);
    const signature = secp256k1.sign(hash, privateKey, { lowS: false });
    this.#transaction.signature = [concatBytes(
      numberToBytesBE(signature.r, 32),
      numberToBytesBE(signature.s, 32),
      numberToBytesBE(signature.recovery, 1)
    )];
    return this;
  }

  serialize() {
    return protocol.Transaction.encode(this.#transaction).finish();
  }

  toObject() {
    return protocol.Transaction.toObject(this.#transaction);
  }
}

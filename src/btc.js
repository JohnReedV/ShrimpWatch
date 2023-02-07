import { parentPort } from 'worker_threads'
import { btcQueries } from './btcQueries.js'
import { DBHandler } from './dbHandler.js'
import * as fs from 'fs'
import Bitcore from "bitcore-lib"
import crypto from 'crypto'

class Btc {
    conf
    db
    btcQ
    blockNumber

    constructor() {
        this.btcQ = new btcQueries()
        this.db = new DBHandler()
        this.conf = JSON.parse(fs.readFileSync('./conf.json', 'utf8'))

        parentPort.on('message', async (message) => {
            this.blockNumber = message.blockNumber
            console.log("Working on BTC block : " + this.blockNumber)

            this.startBtc().then(async () => {
                await this.db.endBlockBtc(this.blockNumber)
                parentPort.postMessage({ done: true, blockNumber: this.blockNumber })
            }).catch((e) => {
                console.log(`Error on BTC block: ${this.blockNumber} Message: ${e} :end message`)
                parentPort.postMessage({ done: false, blockNumber: this.blockNumber })
            })
        })
    }

    async startBtc() {
        let blockHash = await this.btcQ.getBlockHash(this.blockNumber)
        let block = await this.btcQ.getBlock(blockHash)

        for (let i = 0; i < block.tx.length; i++) {
            let rawTX = await this.btcQ.getRawTX(block.tx[i], blockHash)
            let decodedTX = await this.btcQ.getDecodedTX(rawTX.hex)

            if (this.isCoinbase(decodedTX)) { //coinbase transactions are mints with no sender

                let coinbases = []
                for (let c = 0; c < decodedTX.vout.length; c++) {
                    let cbAddress = decodedTX.vout[c].scriptPubKey.address
                    let cbValue = decodedTX.vout[c].value
                    if (cbAddress && cbValue) {
                        coinbases.push({
                            address: cbAddress,
                            value: cbValue,
                        })
                    }
                }
                await this.db.fillCoinbase(coinbases, rawTX, block)

            }
            else {
                let senders = await this.getSenders(rawTX.hex)
                let receivers = await this.getReceivers(decodedTX)

                await this.db.fillTransactionBtc(rawTX, senders, receivers, block, this.getTypes(decodedTX))
                await this.db.fillBtcWallet(senders, receivers, rawTX.txid)

            }
        }
    }

    async getReceivers(decodedTX) {
        let receivers = []
        for (let v = 0; v < decodedTX.vout.length; v++) {
            const vout = decodedTX.vout[v]
            if (vout.scriptPubKey.type == 'nulldata' || !vout.scriptPubKey.address) { continue }

            receivers.push({
                address: vout.scriptPubKey.address,
                value: vout.value,
                index: v
            })
        }
        return receivers
    }

    async getSenders(txHex) {
        const transaction = Bitcore.Transaction(txHex)
        let senders = []
        for (let i = 0; i < transaction.inputs.length; i++) {
            const input = transaction.inputs[i]
            let oldTransaction = await this.btcQ.getTransactionFromTxId(input.prevTxId.toString('hex'))
            let decodedTX = await this.btcQ.getDecodedTX(oldTransaction.hex)
            let spk = decodedTX.vout[input.outputIndex].scriptPubKey
            if (spk.address) {
                senders.push({
                    address: spk.address,
                    value: decodedTX.vout[input.outputIndex].value,
                    index: i
                })
            }
        }
        return senders
    }

    isCoinbase(decodedTX) {
        if (decodedTX.vin[0].coinbase) { return true } else { return false }
    }

    getTypes(decodedTX) {
        const P2SH = this.isP2SHTransaction(decodedTX)
        const multisig = this.isMultiSig(decodedTX)
        const atomic = this.isAtomicSwap(decodedTX)

        if (P2SH) {
            if (multisig) {
                if (atomic) {
                    return ["multi-sig", "P2SH", "atomic"]
                } else {
                    return ["multi-sig", "P2SH"]
                }
            } else {
                if (atomic) {
                    return ["P2SH", "atomic"]
                } else {
                    return ["P2SH"]
                }
            }
        } else if (multisig) {
            if (atomic) {
                return ["multi-sig", "atomic"]
            } else {
                return ["multi-sig"]
            }
        } else if (atomic) {
            return ["atomic"]
        } else { return ["regular"] }
    }

    isMultiSig(decodedTX) {
        for (let i = 0; i < decodedTX.vin.length; i++) {
            if (decodedTX.vin[i].scriptSig.asm.includes("OP_CHECKMULTISIG") ||
                decodedTX.vin[i].scriptSig.asm.includes("OP_CHECKMULTISIGVERIFY")) {
                return true
            }
        }
        return false
    }


    isP2SHTransaction(tx) {
        for (let i = 0; i < tx.vout.length; i++) {
            const outputScript = tx.vout[i].scriptPubKey.hex
            if (outputScript.startsWith("a914") && outputScript.endsWith("87")) {
                const hash = outputScript.substring(4, outputScript.length - 2)
                if (hash.length === 40) {
                    const hashBuffer = Buffer.from(hash, "hex")
                    const hashHex = crypto.createHash("sha256").update(hashBuffer).digest("hex")
                    if (hashHex.length === 64) {
                        return true
                    }
                }
            }
            else if (outputScript.startsWith("0014") && outputScript.endsWith("ae")) {
                const hash = outputScript.substring(4, outputScript.length - 2)
                if (hash.length === 40) {
                    const hashBuffer = Buffer.from(hash, "hex")
                    const hashHex = crypto.createHash("sha256").update(hashBuffer).digest("hex")
                    if (hashHex.length === 64) {
                        return true
                    }
                }
            }
        }
        return false
    }

    isAtomicSwap(decodedTx) {
        const atomicSwapScripts = [
            "a914ab865b9f1c6e76fcf2e47c726f8775a32a7f51da87",
            "0014e82b8f0b7c3e0e71c3c5bb5e06b5c5f5d967d0c1",
            "a91482a066b7f0ddc51ccb07be07dbf9a44d898eec7587",
            "0014d85c2b71d0060b09c9886aeb815e50991dda124f",
            "0014bccdc6b593050adad3b1cbc0b9e3ea08dde2ece7",
            "a9142c7e0a04f4d4c1f979f96ccbcfdb33b8f7fc87187",
            "0014cbc5437f13adf0cc9b66e9d8afd8af7c3cc00c3b",
            "a914d7f07e9c66b788b9f0b06ea7b4c28e64dc0e0ed787",
            "0014f24aeb7f5d5c835ea7aee5f6df7ff6c57dfdfbfd",
            "0014d1cdde93637b937fa97469b2f7b04a3f2c3d3e0d"
        ]

        for (let i = 0; i < decodedTx.vout.length; i++) {
            let output = decodedTx.vout[i]
            if (atomicSwapScripts.includes(output.scriptPubKey.hex)) {
                return true
            }
        }
        return false
    }

}

new Btc()
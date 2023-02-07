import { parentPort } from 'worker_threads'
import { btcQueries } from './btcQueries.js'
import { DBHandler } from './dbHandler.js'
import * as fs from 'fs'
import Bitcore from "bitcore-lib"

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
                            type: decodedTX.vout[c].scriptPubKey.type
                        })
                    }
                }
                await this.db.fillCoinbase(coinbases, rawTX, block)

            }
            else {
                let senders = await this.getSenders(rawTX.hex)
                let receivers = await this.getReceivers(decodedTX)

                await this.db.fillTransactionBtc(rawTX, senders, receivers, block)
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
                type: vout.scriptPubKey.type,
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
                    type: spk.type,
                    index: i
                })
            }
        }
        return senders
    }

    isCoinbase(decodedTX) {
        if (decodedTX.vin[0].coinbase) { return true } else { return false }
    }
}

new Btc()
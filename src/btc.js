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

        parentPort.on('message', (message) => {
            this.blockNumber = message.blockNumber
            console.log("Working on BTC block : " + this.blockNumber)
            this.startBtc()
        })
    }

    async startBtc() {
        let blockHash = await this.btcQ.getBlockHash(this.blockNumber)
        let block = await this.btcQ.getBlock(blockHash)

        for (let i = 0; i < block.tx.length; i++) {
            let rawTX = await this.btcQ.getRawTX(block.tx[i], blockHash)
            let decodedTX = await this.btcQ.getDecodedTX(rawTX.hex)

            if (!decodedTX.vin[0].coinbase) { //coinbase transactions are mints with no sender
                let senders = await this.getSenders(rawTX.hex)
                let receivers = await this.getReceivers(decodedTX)

                await this.db.fillBtcWallet(senders, receivers)
                await this.db.fillTransactionBtc(rawTX, senders, receivers, block)
                this.db.fillPuts(rawTX.txid, senders, receivers)
            } else { 
                await this.db.fillCoinbase({
                    address: decodedTX.vout[0].scriptPubKey.address,
                    value: decodedTX.vout[0].value,
                }) }
        }

        parentPort.postMessage({ done: true, blockNumber: this.blockNumber })
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
            let decodedTX = await this.btcQ.getDecodedTX(oldTransaction)
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
}

new Btc()
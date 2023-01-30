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

            if (!decodedTX.vin[0].coinbase) {
                let senders = await this.getSenders(rawTX.hex)
                let receivers = await this.getReceivers(decodedTX)
                
            } else {
                //bitcoin mint no sender
                let receivers = await this.getReceivers(decodedTX)
            }
        }

        parentPort.postMessage({ done: true, blockNumber: this.blockNumber })
    }

    async getReceivers(decodedTX) {
        let receivers = []
        for (let v = 0; v < decodedTX.vout.length; v++) {
            receivers.push(decodedTX.vout[v].scriptPubKey.address)
        }
        return receivers
    }

    async getSenders(txHex) {
        const transaction = Bitcore.Transaction(txHex)
        let senders = []
        for (let i = 0; i < transaction.inputs.length; i++) {
            const input = transaction.inputs[i]
            let oldTxid = transaction.inputs[i].prevTxId.toString('hex')
            let oldTransaction = await this.btcQ.getTransactionFromTxId(oldTxid)
            let decodedTX = await this.btcQ.getDecodedTX(oldTransaction)
            let spk = decodedTX.vout[input.outputIndex].scriptPubKey
            if (spk.address) {
                senders.push(spk.address)
            } else if (spk.addresses) {
                senders = senders.concat(spk.address)
            }
        }
        return senders
    }

}

new Btc()
import Web3 from 'web3'
import * as fs from 'fs'
import { DBHandler } from './dbHandler.js'
import { parentPort, workerData } from 'worker_threads'
import { Lock } from './atomicLock.js'

class Eth {
    conf
    web3
    db
    blockNumber
    lock

    constructor() {
        this.conf = JSON.parse(fs.readFileSync('./conf.json', 'utf8'))
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.conf.ethHttpProvider))
        this.db = new DBHandler()

        parentPort.on('message', async (message) => {
            this.lock = new Lock(workerData.iab)
            this.blockNumber = message.blockNumber
            console.log("Working on ETH block : " + this.blockNumber)

            this.starteth().then(async () => {
                await this.db.endBlockEth(this.blockNumber)
                parentPort.postMessage({ done: true, blockNumber: this.blockNumber })
            }).catch((e) => {
                console.log(`Error on ETH block: ${this.blockNumber} Message: ${e} :end message`)
                parentPort.postMessage({ done: false, blockNumber: this.blockNumber })
            })
        })
    }

    async starteth() {
        let currentBlock = await this.web3.eth.getBlock(this.blockNumber)
        for (let i = 0; i < currentBlock.transactions.length; i++) {
            let transaction = await this.web3.eth.getTransaction(currentBlock.transactions[i])
            if (transaction.input === '0x' && transaction.value > 0) {
                //regular eth transfer
                if (await this.isContract(transaction.to)) {
                    //transfer to contract
                    this.lock.lock()
                    await this.db.fillWalletEth(transaction, this.web3, "toContract")
                    await this.db.fillTransactionEth(transaction, currentBlock, "toContract")
                    this.lock.unlock()
                } else if (await this.isContract(transaction.from)) {
                    //transfer from contract
                    this.lock.lock()
                    await this.db.fillWalletEth(transaction, this.web3, "fromContract")
                    await this.db.fillTransactionEth(transaction, currentBlock, "fromContract")
                    this.lock.unlock()
                } else {
                    // regular transfer
                    this.lock.lock()
                    await this.db.fillWalletEth(transaction, this.web3, currentBlock.timestamp, "regular")
                    await this.db.fillTransactionEth(transaction, currentBlock, "regular")
                    this.lock.unlock()
                }
            } else if (transaction.input.startsWith('0xa9059cbb')) {
                // erc20 transfer
            }
        }
    }

    async isContract(address) {
        const code = await this.web3.eth.getCode(address)
        if (code.length > 2) { return true } else return false
    }
}

new Eth()
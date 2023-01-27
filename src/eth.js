import Web3 from 'web3'
import * as fs from 'fs'
import { DBHandler } from './dbHandler.js'
import { parentPort } from 'worker_threads'

class Eth {
    conf
    web3
    db
    blockNumber

    constructor() {
        this.conf = JSON.parse(fs.readFileSync('./conf.json', 'utf8'))
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.conf.ethHttpProvider))
        this.db = new DBHandler()


        parentPort.on('message', (message) => {
            this.blockNumber = message.blockNumber
            console.log("Working on block : " + this.blockNumber)
            this.starteth()
        })
    }

    async starteth() {
        let currentBlock = await this.web3.eth.getBlock(this.blockNumber)
        for (let i = 0; i < currentBlock.transactions.length; i++) {
            let transaction = await this.web3.eth.getTransaction(currentBlock.transactions[i])
            if (transaction.input === '0x' && transaction.value > 0) {
                //regular eth transfer
                this.handleTransfer(transaction, currentBlock, this.web3)
            } else if (transaction.input.startsWith('0xa9059cbb')) {
                // erc20 transfer
            }
        }
        parentPort.postMessage({ done: true, blockNumber:  this.blockNumber})
    }

    async handleTransfer(transaction, block, web3) {
        const rawTransaction = await web3.eth.getTransactionReceipt(transaction.hash)
        if (await this.isContract(rawTransaction.to, web3)) {
            //transfer to contract
            await this.db.fillWalletEth(transaction, web3, "toContract")
            this.db.fillTransactionEth(transaction, rawTransaction, block, "toContract")
        } else if (await this.isContract(rawTransaction.from, web3)) {
            //transfer from contract
            await this.db.fillWalletEth(transaction, web3, "fromContract")
            this.db.fillTransactionEth(transaction, rawTransaction, block, "fromContract")
        } else {
            // regular transfer
            await this.db.fillWalletEth(transaction, web3, "regular")
            this.db.fillTransactionEth(transaction, rawTransaction, block, "regular")
        }
    }

    async isContract(address, web3) {
        const code = await web3.eth.getCode(address)
        if (code.length > 2) { return true } else return false
    }
}

new Eth()
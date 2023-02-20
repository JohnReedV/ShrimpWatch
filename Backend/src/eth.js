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
        this.lock = new Lock(workerData.iab)

        parentPort.on('message', async (message) => {
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
                    const nonceFrom = await this.web3.eth.getTransactionCount(transaction.from, 'latest')
                    const blanceFromWei = await this.web3.eth.getBalance(transaction.from)
                    const blanceFrom = this.web3.utils.fromWei(blanceFromWei, 'ether')
                    const balanceFromAtBlock = await this.web3.eth.getBalance(transaction.from, transaction.blockNumber)

                    this.lock.lock()
                    await this.db.fillWalletEthToContract(transaction, currentBlock.timestamp, nonceFrom, blanceFrom, balanceFromAtBlock)
                    await this.db.fillTransactionEth(transaction, currentBlock, "toContract")
                    this.lock.unlock()
                } else if (await this.isContract(transaction.from)) {
                    const nonceTo = await this.web3.eth.getTransactionCount(transaction.to, 'latest')
                    const blanceToWei = await this.web3.eth.getBalance(transaction.to)
                    const balanceTo = this.web3.utils.fromWei(blanceToWei, 'ether')
                    const balanceToAtBlock = await this.web3.eth.getBalance(transaction.to, transaction.blockNumber)

                    this.lock.lock()
                    await this.db.fillWalletEthFromContract(transaction, currentBlock.timestamp, nonceTo, balanceTo, balanceToAtBlock)
                    await this.db.fillTransactionEth(transaction, currentBlock, "fromContract")
                    this.lock.unlock()
                } else {
                    const nonceTo = await this.web3.eth.getTransactionCount(transaction.to, 'latest')
                    const blanceToWei = await this.web3.eth.getBalance(transaction.to)
                    const balanceTo = this.web3.utils.fromWei(blanceToWei, 'ether')
                    const nonceFrom = await this.web3.eth.getTransactionCount(transaction.from, 'latest')
                    const blanceFromWei = await this.web3.eth.getBalance(transaction.from)
                    const balanceFrom = this.web3.utils.fromWei(blanceFromWei, 'ether')

                    this.lock.lock()
                    await this.db.fillWalletEth(transaction, currentBlock.timestamp, nonceTo, nonceFrom, balanceTo, balanceFrom)
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
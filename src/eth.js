import Web3 from 'web3'
import { Utils } from './utils.js'
import * as fs from 'fs';

export class Eth {
    conf
    web3
    utils

    constructor() {
        this.conf = JSON.parse(fs.readFileSync('./conf.json', 'utf8'))
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.conf.httpProvider))
        this.utils = new Utils()
    }

    async startEth() {
        let currentBlockNumber = this.conf.startblock
        while (true) {
            let latestBlock = await this.web3.eth.getBlock('latest')
            let latestBlockNumber = latestBlock.number

            // If at top of chain, wait for next block
            if (currentBlockNumber >= latestBlockNumber) {
                await this.utils.sleep(1000)
                continue
            }

            let currentBlock = await this.web3.eth.getBlock(currentBlockNumber)
            for (let i = 0; i < currentBlock.transactions.length; i++) {
                let transaction = await this.web3.eth.getTransaction(currentBlock.transactions[i])
                if (transaction.input === '0x' && transaction.value > 0) {
                    //regular eth transfer
                    this.handleTransfer(currentBlock.transactions[i], this.web3)
                } else if (transaction.input.startsWith('0xa9059cbb')) {
                    // erc20 transfer
                }
            }

            currentBlockNumber++
            console.log(currentBlockNumber)
        }
    }

    async handleTransfer(transactionHash, web3) {
        const rawTransaction = await web3.eth.getTransactionReceipt(transactionHash)
        if (await this.isContract(rawTransaction.to, web3)) {
            //transfer to contract
        } else if (await this.isContract(rawTransaction.from, web3)) {
            //transfer from contract
        } else {
            // regular transfer
        }
    }

    async isContract(address, web3) {
        const code = await web3.eth.getCode(address)
        if (code.length > 2) { return true } else return false
    }
}

new Eth().startEth()
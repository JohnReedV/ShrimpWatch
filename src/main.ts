const Web3 = require('web3')
const conf = require('../conf')
import { Utils } from './Utils'
import { Transfer } from './transfer'

class ShrimpWatch {
    web3: any
    utils: Utils
    transfer: Transfer

    constructor() {
        this.web3 = new Web3(new Web3.providers.HttpProvider(conf.httpProvider))
        this.utils = new Utils()
        this.transfer = new Transfer()
    }

    async start() {
        let currentBlockNumber: number = conf.startblock
        while (true) {
            let latestBlock = await this.web3.eth.getBlock('latest')
            let latestBlockNumber: number = latestBlock.number

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
                    this.transfer.handleTransfer(currentBlock.transactions[i], this.web3)
                } else if (transaction.input.startsWith('0xa9059cbb')) {
                    // erc20 transfer
                }
            }

            currentBlockNumber++
        }
    }
}

function main() {
    let shrimp: ShrimpWatch = new ShrimpWatch();
    shrimp.start();
}
main()
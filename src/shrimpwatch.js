import { Worker } from 'worker_threads'
import * as fs from 'fs'
import Web3 from 'web3'
import { btcQueries } from './btcQueries.js'

class ShrimpWatch {

    async start() {
        const conf = JSON.parse(fs.readFileSync('./conf.json', 'utf8'))
        let numWorkers = Math.round(conf.workerPoolSize)

        if (conf.btcOn && conf.ethOn) {
            if (numWorkers % 2 !== 0) {
                numWorkers = (numWorkers - 1) / 2
                console.log(`Number of workers is not divisible by 2, using ${numWorkers} workers for each blockchain`)
            } else { numWorkers = numWorkers / 2 }

            this.computeBtc(numWorkers, conf)
            this.computeEth(numWorkers, conf)
        } else if (conf.btcOn) {
            this.computeBtc(numWorkers, conf)
        } else if (conf.ethOn) {
            this.computeEth(numWorkers, conf)
        }

    }

    async computeBtc(numWorkers, conf) {
        const btcQ = new btcQueries()
        let btcWorkers = []
        let btcCompletedBlocks = new Set()
        
        // assign work
        for (let i = 0; i < numWorkers; i++) {
            let blockNumber = conf.btcstartblock + i
            while (btcCompletedBlocks.has(blockNumber)) {
                blockNumber++
            }
            btcCompletedBlocks.add(blockNumber)
            const btcWorker = new Worker('./src/btc.js')
            btcWorker.postMessage({ blockNumber })
            btcWorkers.push(btcWorker)
        }

        for (let worker of btcWorkers) {
            worker.on('message', async (message) => {
                if (message.done) {
                    // If at top of chain, wait for next block
                    let latestBlockNumber = await btcQ.getBlockHeight()
                    while (message.blockNumber >= latestBlockNumber) {
                        latestBlockNumber = await btcQ.getBlockHeight()
                    }
                    // reassign work
                    let blockNumber = message.blockNumber++
                    while (btcCompletedBlocks.has(blockNumber)) {
                        blockNumber++
                    }
                    btcCompletedBlocks.add(blockNumber)
                    worker.postMessage({ blockNumber })
                }
            })
        }

    }

    async computeEth(numWorkers, conf) {
        const web3 = new Web3(new Web3.providers.HttpProvider(conf.ethHttpProvider))
        let ethWorkers = []
        let ethCompletedBlocks = new Set()

        // assign work
        for (let i = 0; i < numWorkers; i++) {
            let blockNumber = conf.ethstartblock + i
            while (ethCompletedBlocks.has(blockNumber)) {
                blockNumber++
            }
            ethCompletedBlocks.add(blockNumber)
            const ethWorker = new Worker('./src/eth.js')
            ethWorker.postMessage({ blockNumber })
            ethWorkers.push(ethWorker)
        }

        for (let worker of ethWorkers) {
            worker.on('message', async (message) => {
                if (message.done) {
                    // If at top of chain, wait for next block
                    let latestBlock = await web3.eth.getBlock('latest')
                    let latestBlockNumber = latestBlock.number
                    while (message.blockNumber >= latestBlockNumber) {
                        latestBlock = await web3.eth.getBlock('latest')
                        latestBlockNumber = latestBlock.number
                    }
                    // reassign work
                    let blockNumber = message.blockNumber++
                    while (ethCompletedBlocks.has(blockNumber)) {
                        blockNumber++
                    }
                    ethCompletedBlocks.add(blockNumber)
                    worker.postMessage({ blockNumber })
                }
            })
        }
    }
}

const shrimp = new ShrimpWatch()
shrimp.start()
import { Worker } from 'worker_threads'
import * as fs from 'fs'
import Web3 from 'web3'

class ShrimpWatch {
    async start() {
        const conf = JSON.parse(fs.readFileSync('./conf.json', 'utf8'))
        const web3 = new Web3(new Web3.providers.HttpProvider(conf.httpProvider))
        const numWorkers = conf.workerPoolSize
        let workers = []
        let completedBlocks = new Set()

        for (let i = 0; i < numWorkers; i++) {
            let blockNumber = conf.startblock + i
            while (completedBlocks.has(blockNumber)) {
                blockNumber++
            }
            completedBlocks.add(blockNumber)
            const worker = new Worker('./src/eth.js')
            worker.postMessage({ blockNumber })
            workers.push(worker)
        }

        // Wait for all workers to complete
        for (let worker of workers) {
            worker.on('message', async (message) => {
                if (message.done) {
                    let latestBlock = await web3.eth.getBlock('latest')
                    let latestBlockNumber = latestBlock.number
                    // If at top of chain, wait for next block and assign work
                    while (message.blockNumber >= latestBlockNumber) {
                        latestBlock = await web3.eth.getBlock('latest')
                        latestBlockNumber = latestBlock.number
                    }
                    let blockNumber = message.blockNumber++
                    while (completedBlocks.has(blockNumber)) {
                        blockNumber++
                    }
                    completedBlocks.add(blockNumber)
                    worker.postMessage({ blockNumber })
                }
            })
        }
    }
}

const shrimp = new ShrimpWatch()
shrimp.start()
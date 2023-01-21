import { Worker } from 'worker_threads'

class ShrimpWatch {

    async start() {
        try {
            const ethWorker = new Worker('./src/eth.js')
            const btcWoerk = new Worker('./src/btc.js')
        } catch (error) { console.log(error) }
    }
}

const shrimp = new ShrimpWatch()
shrimp.start()
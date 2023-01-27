import { btcQueries } from './btcQueries.js'
import { DBHandler } from './dbHandler.js'

class Btc {
    db
    btcQ

    constructor() {
        this.btcQ = new btcQueries()
        this.db = new DBHandler()
    }

    async startBtc() {
        console.log('btc on')
    }
}

new Btc().startBtc()
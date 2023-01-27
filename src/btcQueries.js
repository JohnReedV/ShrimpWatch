import axios from 'axios'
import * as fs from 'fs'

export class btcQueries {
    conf
    headers
    rpc

    constructor() {
        this.conf = JSON.parse(fs.readFileSync('./conf.json', 'utf8'))
        this.rpc = this.conf.btcHttpProvider
        this.headers = {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + Buffer.from(this.conf.btcRpcUser + ':' + this.conf.btcRpcPassword).toString('base64')
        }
    }

    async getBlockHeight() {
        const getBlockCountPayload = {
            jsonrpc: '1.0',
            id: 'curltext',
            method: 'getblockcount',
            params: []
        }
        let getBlockCountResponse = await axios.post(this.rpc, getBlockCountPayload, { headers: this.headers })
        return getBlockCountResponse.data.result
    }

    async getBlockHash(blockNumber) {
        const getBlockHashPayload = {
            jsonrpc: '1.0',
            id: 'curltext',
            method: 'getblockhash',
            params: [blockNumber]
        }
        let blockHash = await axios.post(this.rpc, getBlockHashPayload, { headers: this.headers })
        return blockHash.data.result
    }

    async getBlock(blockHash) {
        const getBlockByHeightPayload = {
            jsonrpc: '1.0',
            id: 'curltext',
            method: 'getblock',
            params: [blockHash]
        }
        let getBlockByHeightResponse = await axios.post(this.rpc, getBlockByHeightPayload, { headers: this.headers })
        return getBlockByHeightResponse.data.result
    }

    async getRawTX(txHash, blockHash) {
        const rawTXPayload = {
            jsonrpc: '1.0',
            id: 'curltext',
            method: 'getrawtransaction',
            params: [txHash, true, blockHash]
          }
          let getrawTX = await axios.post(this.rpc, rawTXPayload, {headers: this.headers})
          return getrawTX.data.result
    }
}
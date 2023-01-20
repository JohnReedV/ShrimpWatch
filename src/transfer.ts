import { Utils } from './Utils'

export class Transfer {
    utils: Utils
    constructor() {
        this.utils = new Utils()
    }

    async handleTransfer(transactionHash: string, web3: any) {
        const rawTransaction = await web3.eth.getTransactionReceipt(transactionHash)
        if (await this.utils.isContract(rawTransaction.to, web3)) {
            //transfer to contract
        } else if (await this.utils.isContract(rawTransaction.from, web3)) {
            //transfer from contract
        } else {
            // regular transfer
        }
    }
}
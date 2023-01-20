const Web3 = require('web3');
const conf = require('../conf')

class ShrimpWatch {
    web3: any;
    

    constructor() {
        this.web3 = new Web3(new Web3.providers.HttpProvider(conf.httpProvider))
    }
    
    async start() {
        console.log("hello world")
        console.log(await this.web3.eth.getBlock('latest'))
    }
}

function main() {
    let shrimp: ShrimpWatch = new ShrimpWatch();
    shrimp.start();
}
main()
export class Utils {

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async isContract(address: string, web3: any): Promise<boolean> {
        const code = await web3.eth.getCode(address)
        if (code.length > 2) { return true } else return false
    }
}
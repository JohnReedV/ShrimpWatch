import { PrismaClient } from "@prisma/client"

export class DBHandler {
    prisma

    constructor() {
        this.prisma = new PrismaClient()
    }

    async fillWalletEth(transaction, web3, type) {

        if (type == "toContract") {
            const nonceFrom = await web3.eth.getTransactionCount(transaction.from, 'latest')
            const blanceFrom = await web3.eth.getBalance(transaction.from)

            await this.prisma.wallet.create({
                data: {
                    id: transaction.from.toLowerCase(),
                    balance: blanceFrom.toString(),
                    nonce: nonceFrom.toString()

                }
            }).then(async () => {
                this.prisma.$disconnect()
            }).catch(async (e) => {
                this.prisma.$disconnect()
            })

        } else if (type == "fromContract") {
            const nonceTo = await web3.eth.getTransactionCount(transaction.to, 'latest')
            const blanceTo = await web3.eth.getBalance(transaction.to)

            await this.prisma.wallet.create({
                data: {
                    id: transaction.to.toLowerCase(),
                    balance: blanceTo.toString(),
                    nonce: nonceTo.toString()

                }
            }).then(async () => {
                this.prisma.$disconnect()
            }).catch(async (e) => {
                this.prisma.$disconnect()
            })

        } else if (type == "regular") {
            const nonceTo = await web3.eth.getTransactionCount(transaction.to, 'latest')
            const blanceTo = await web3.eth.getBalance(transaction.to)
            const nonceFrom = await web3.eth.getTransactionCount(transaction.from, 'latest')
            const blanceFrom = await web3.eth.getBalance(transaction.from)

            await this.prisma.wallet.create({
                data: {
                    id: transaction.to.toLowerCase(),
                    balance: blanceTo.toString(),
                    nonce: nonceTo.toString()

                }
            }).then(async () => {
                this.prisma.$disconnect()
            }).catch(async (e) => {
                this.prisma.$disconnect()
            })

            await this.prisma.wallet.create({
                data: {
                    id: transaction.from.toLowerCase(),
                    balance: blanceFrom.toString(),
                    nonce: nonceFrom.toString()

                }
            }).then(async () => {
                this.prisma.$disconnect()
            }).catch(async (e) => {
                this.prisma.$disconnect()
            })
        }
    }

    async fillTransactionEth(transaction, block, type) {

        await this.prisma.transaction.create({
            data: {
                id: transaction.hash,
                from: transaction.from.toLowerCase(),
                to: transaction.to.toLowerCase(),
                blockHash: transaction.blockHash,
                blockNumber: transaction.blockNumber.toString(),
                baseFeePerGas: block.baseFeePerGas.toString(),
                gasUsed: transaction.gas.toString(),
                gasPrice: transaction.gasPrice,
                feePerGas: transaction.maxFeePerGas,
                priorityFeeperGas: transaction.maxPriorityFeePerGas,
                timeStamp: block.timestamp.toString(),
                chain: "Ethereum",
                type: type
            }
        }).then(async () => {
            this.prisma.$disconnect()
        }).catch(async (e) => {
            this.prisma.$disconnect()
        })
    }
}
import { PrismaClient } from "@prisma/client"
import md5 from "md5"

export class DBHandler {
    prisma

    constructor() {
        this.prisma = new PrismaClient()
    }

    async fillPuts(txId, senders, receivers) {

        for (let i = 0; i < senders.length; i++) {
            const sender = senders[i]

            await this.prisma.input.create({
                data: {
                    id: md5(`${txId}${sender.address}${sender.index}`),
                    publicKey: sender.address,
                    amount: sender.value.toString(),
                    txId: txId
                }
            }).then(async () => {
                this.prisma.$disconnect()
            }).catch(async (e) => {
                this.prisma.$disconnect()
            })
        }

        for (let i = 0; i < receivers.length; i++) {
            const receiver = receivers[i]

            await this.prisma.output.create({
                data: {
                    id: md5(`${txId}${receiver.address}${receiver.index}`),
                    publicKey: receiver.address,
                    amount: receiver.value.toString(),
                    txId: txId
                }
            }).then(async () => {
                this.prisma.$disconnect()
            }).catch(async (e) => {
                this.prisma.$disconnect()
            })
        }
    }

    async fillTransactionBtc(transaction, senders, receivers, block) {
        let amountSent = 0
        let amountReceived = 0
        for (let i = 0; i < senders.length; i++) { amountSent = amountSent + senders[i].value }
        for (let i = 0; i < receivers.length; i++) { amountReceived = amountReceived + receivers[i].value }

        await this.prisma.btcTransaction.create({
            data: {
                id: transaction.txid,
                txHash: transaction.hash,
                amount: amountReceived.toString(),
                blockHash: block.hash,
                blockNumber: block.height.toString(),
                gas: (amountSent - amountReceived).toString(),
                timeStamp: block.time.toString()
            }
        }).then(async () => {
            this.prisma.$disconnect()
        }).catch(async (e) => {
            this.prisma.$disconnect()
        })
    }

    async fillTransactionEth(transaction, block, type) {

        await this.prisma.ethTransaction.create({
            data: {
                id: transaction.hash,
                from: transaction.from.toLowerCase(),
                to: transaction.to.toLowerCase(),
                amount: transaction.value.toString(),
                blockHash: transaction.blockHash,
                blockNumber: transaction.blockNumber.toString(),
                baseFeePerGas: block.baseFeePerGas.toString(),
                gasUsed: transaction.gas.toString(),
                gasPrice: transaction.gasPrice,
                feePerGas: transaction.maxFeePerGas,
                priorityFeeperGas: transaction.maxPriorityFeePerGas,
                timeStamp: block.timestamp.toString(),
                type: type
            }
        }).then(async () => {
            this.prisma.$disconnect()
        }).catch(async (e) => {
            this.prisma.$disconnect()
        })
    }

    async fillWalletEth(transaction, web3, type) {

        if (type == "toContract") {
            const nonceFrom = await web3.eth.getTransactionCount(transaction.from, 'latest')
            const blanceFrom = await web3.eth.getBalance(transaction.from)

            await this.prisma.evmWallet.create({
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

            await this.prisma.evmWallet.create({
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

            await this.prisma.evmWallet.create({
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

            await this.prisma.evmWallet.create({
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
}
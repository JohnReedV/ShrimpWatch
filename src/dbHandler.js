import { PrismaClient } from "@prisma/client"
import md5 from "md5"

export class DBHandler {
    prisma

    constructor() {
        this.prisma = new PrismaClient()
    }

    async createShrimpwatch() {
        await this.prisma.shrimpwatch.create({
            data: { id: "shrimpwatch" }
        }).then(async () => {
            this.prisma.$disconnect()
        }).catch(async (e) => {
            this.prisma.$disconnect()
        })
    }

    async endBlockBtc(blockNumber) {
        await this.prisma.shrimpwatch.update({
            where: { id: "shrimpwatch" },
            data: { lastBlockBtc: blockNumber.toString() }
        }).then(async () => {
            this.prisma.$disconnect()
        }).catch(async (e) => {
            this.prisma.$disconnect()
        })

    }

    async endBlockEth(blockNumber) {
        await this.prisma.shrimpwatch.update({
            where: { id: "shrimpwatch" },
            data: { lastBlockEth: blockNumber.toString() }
        }).then(async () => {
            this.prisma.$disconnect()
        }).catch(async (e) => {
            this.prisma.$disconnect()
        })
    }

    async fillCoinbase(receivers) {
        for (let i = 0; i < receivers.length; i++) {
            const receiver = receivers[i]

            const results = await this.prisma.btcWallet.findMany({
                where: {
                    id: receiver.address.toLowerCase()
                },
                take: 1
            })

            if (results.length == 0) {
                await this.prisma.btcWallet.create({
                    data: {
                        id: receiver.address.toLowerCase(),
                        balance: receiver.value.toString(),
                        nonce: "0",
                    }
                }).then(async () => {
                    this.prisma.$disconnect()
                }).catch(async (e) => {
                    this.prisma.$disconnect()
                })
            } else if (results.length > 0) {
                for (let r = 0; r < results.length; r++) {
                    let oldBalance = parseInt(results[r].balance)
                    let oldNonce = parseInt(results[r].nonce)

                    await this.prisma.btcWallet.create({
                        data: {
                            id: receiver.address.toLowerCase(),
                            balance: (oldBalance + receiver.value).toString(),
                            nonce: oldNonce,
                        }
                    }).then(async () => {
                        this.prisma.$disconnect()
                    }).catch(async (e) => {
                        this.prisma.$disconnect()
                    })
                }
            }
        }
    }

    async fillBtcWallet(senders, receivers) {
        for (let i = 0; i < receivers.length; i++) {
            const receiver = receivers[i]

            const results = await this.prisma.btcWallet.findMany({
                where: {
                    id: receiver.address.toLowerCase()
                },
                take: 1
            })

            if (results.length == 0) {
                await this.prisma.btcWallet.create({
                    data: {
                        id: receiver.address.toLowerCase(),
                        balance: receiver.value.toString(),
                        nonce: "0",
                    }
                }).then(async () => {
                    this.prisma.$disconnect()
                }).catch(async (e) => {
                    this.prisma.$disconnect()
                })
            } else if (results.length > 0) {
                for (let r = 0; r < results.length; r++) {
                    let oldBalance = parseInt(results[r].balance)
                    let oldNonce = parseInt(results[r].nonce)

                    await this.prisma.btcWallet.create({
                        data: {
                            id: receiver.address.toLowerCase(),
                            balance: (oldBalance + receiver.value).toString(),
                            nonce: oldNonce,
                        }
                    }).then(async () => {
                        this.prisma.$disconnect()
                    }).catch(async (e) => {
                        this.prisma.$disconnect()
                    })
                }
            }
        }

        for (let i = 0; i < senders.length; i++) {
            const sender = senders[i]
            const results = await this.prisma.btcWallet.findMany({
                where: {
                    id: sender.address.toLowerCase()
                },
                take: 1
            })

            for (let r = 0; r < results.length; r++) {
                let oldBalance = parseInt(results[r].balance)
                let oldNonce = parseInt(results[r].nonce)

                await this.prisma.btcWallet.create({
                    data: {
                        id: sender.address.toLowerCase(),
                        balance: (oldBalance - sender.value).toString(),
                        nonce: oldNonce++,
                    }
                }).then(async () => {
                    this.prisma.$disconnect()
                }).catch(async (e) => {
                    this.prisma.$disconnect()
                })
            }
        }
    }

    async fillPuts(txId, senders, receivers) {

        for (let i = 0; i < senders.length; i++) {
            const sender = senders[i]

            await this.prisma.input.create({
                data: {
                    id: md5(`${txId}${sender.address.toLowerCase()}${sender.index}`),
                    publicKey: sender.address.toLowerCase(),
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
                    id: md5(`${txId}${receiver.address.toLowerCase()}${receiver.index}`),
                    publicKey: receiver.address.toLowerCase(),
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
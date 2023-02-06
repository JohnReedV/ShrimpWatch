import { PrismaClient } from "@prisma/client"
import md5 from "md5"

export class DBHandler {
    prisma

    constructor() {
        this.prisma = new PrismaClient()
    }

    async endBlockBtc(blockNumber) {

        const pkg = {
            id: "shrimpwatch",
            lastBlockBtc: blockNumber.toString()
        }

        await this.prisma.shrimpwatch.upsert({
            where: { id: pkg.id },
            update: pkg,
            create: pkg
        }).catch((e) => { })
    }

    async endBlockEth(blockNumber) {

        const pkg = {
            id: "shrimpwatch",
            lastBlockEth: blockNumber.toString()
        }

        await this.prisma.shrimpwatch.upsert({
            where: { id: pkg.id },
            update: pkg,
            create: pkg
        }).catch((e) => { })
    }

    async fillCoinbase(receivers, transaction, block) {
        let amountReceived = 0

        for (let i = 0; i < receivers.length; i++) {
            amountReceived = amountReceived + receivers[i].value
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
                }).catch((e) => { })

            } else if (results.length > 0) {
                for (let r = 0; r < results.length; r++) {
                    let oldBalance = parseInt(results[r].balance)

                    const pkg = {
                        id: receiver.address.toLowerCase(),
                        balance: (oldBalance + receiver.value).toString(),
                        nonce: results[r].nonce,
                    }

                    await this.prisma.btcWallet.upsert({
                        where: { id: pkg.id },
                        update: pkg,
                        create: pkg
                    }).catch((e) => { })
                }
            }
        }

        const pkg = {
            id: transaction.txid,
            txHash: transaction.hash,
            amount: amountReceived.toString(),
            blockHash: block.hash,
            blockNumber: block.height.toString(),
            timeStamp: block.time.toString(),
            types: ["coinbase"]
        }

        await this.prisma.btcTransaction.upsert({
            where: { id: pkg.id },
            update: pkg,
            create: pkg
        }).catch((e) => { })

    }

    async fillBtcWallet(senders, receivers, txId) {
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
                }).catch((e) => { })

            } else if (results.length > 0) {
                for (let r = 0; r < results.length; r++) {
                    let oldBalance = parseInt(results[r].balance)

                    const pkg = {
                        id: receiver.address.toLowerCase(),
                        balance: (oldBalance + receiver.value).toString(),
                        nonce: results[r].nonce,
                    }

                    await this.prisma.btcWallet.upsert({
                        where: { id: pkg.id },
                        update: pkg,
                        create: pkg
                    }).catch((e) => { })
                }
            }

            const putPkg = {
                id: md5(`${txId}${receiver.address.toLowerCase()}${receiver.index}`),
                publicKey: receiver.address.toLowerCase(),
                amount: receiver.value.toString(),
                txId: txId
            }

            await this.prisma.output.upsert({
                where: { id: putPkg.id },
                update: putPkg,
                create: putPkg
            }).catch((e) => { })
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

                const pkg = {
                    id: sender.address.toLowerCase(),
                    balance: (oldBalance - sender.value).toString(),
                    nonce: (oldNonce++).toString(),
                }

                await this.prisma.btcWallet.upsert({
                    where: { id: pkg.id },
                    update: pkg,
                    create: pkg
                }).catch((e) => { })

                const putPkg = {
                    id: md5(`${txId}${sender.address.toLowerCase()}${sender.index}`),
                    publicKey: sender.address.toLowerCase(),
                    amount: sender.value.toString(),
                    txId: txId
                }

                await this.prisma.input.upsert({
                    where: { id: putPkg.id },
                    update: putPkg,
                    create: putPkg
                }).catch((e) => { })
            }
        }
    }

    async fillTransactionBtc(transaction, senders, receivers, block, types) {
        let amountSent = 0
        let amountReceived = 0
        for (let i = 0; i < senders.length; i++) { amountSent = amountSent + senders[i].value }
        for (let i = 0; i < receivers.length; i++) { amountReceived = amountReceived + receivers[i].value }

        const pkg = {
            id: transaction.txid,
            txHash: transaction.hash,
            amount: amountReceived.toString(),
            blockHash: block.hash,
            blockNumber: block.height.toString(),
            gas: (amountSent - amountReceived).toString(),
            timeStamp: block.time.toString(),
            types: types
        }

        await this.prisma.btcTransaction.upsert({
            where: { id: pkg.id },
            update: pkg,
            create: pkg
        }).catch((e) => { })
    }

    async fillTransactionEth(transaction, block, type) {

        const pkg = {
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

        await this.prisma.ethTransaction.upsert({
            where: { id: pkg.id },
            update: pkg,
            create: pkg
        }).catch((e) => { })
    }

    async fillWalletEth(transaction, web3, type) {

        if (type == "toContract") {
            const nonceFrom = await web3.eth.getTransactionCount(transaction.from, 'latest')
            const blanceFrom = await web3.eth.getBalance(transaction.from)

            const pkgFrom = {
                id: transaction.from.toLowerCase(),
                balance: blanceFrom.toString(),
                nonce: nonceFrom.toString()
            }

            await this.prisma.evmWallet.upsert({
                where: { id: pkgFrom.id },
                update: pkgFrom,
                create: pkgFrom
            }).catch((e) => { })

        } else if (type == "fromContract") {
            const nonceTo = await web3.eth.getTransactionCount(transaction.to, 'latest')
            const blanceTo = await web3.eth.getBalance(transaction.to)

            const pkgTo = {
                id: transaction.to.toLowerCase(),
                balance: blanceTo.toString(),
                nonce: nonceTo.toString()
            }

            await this.prisma.evmWallet.upsert({
                where: { id: pkgTo.id },
                update: pkgTo,
                create: pkgTo
            }).catch((e) => { })

        } else if (type == "regular") {
            const nonceTo = await web3.eth.getTransactionCount(transaction.to, 'latest')
            const blanceTo = await web3.eth.getBalance(transaction.to)
            const nonceFrom = await web3.eth.getTransactionCount(transaction.from, 'latest')
            const blanceFrom = await web3.eth.getBalance(transaction.from)

            const pkgFrom = {
                id: transaction.from.toLowerCase(),
                balance: blanceFrom.toString(),
                nonce: nonceFrom.toString()
            }

            const pkgTo = {
                id: transaction.to.toLowerCase(),
                balance: blanceTo.toString(),
                nonce: nonceTo.toString()
            }

            await this.prisma.evmWallet.upsert({
                where: { id: pkgTo.id },
                update: pkgTo,
                create: pkgTo
            }).catch((e) => { })

            await this.prisma.evmWallet.upsert({
                where: { id: pkgFrom.id },
                update: pkgFrom,
                create: pkgFrom
            }).catch((e) => { })
        }
    }
}
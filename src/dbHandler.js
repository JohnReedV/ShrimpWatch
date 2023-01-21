import { PrismaClient } from "@prisma/client"

export class DBHandler {
    prisma

    constructor() {
        this.prisma = new PrismaClient()
    }

    async fillTransaction(transaction, rawTransaction) {

        await this.prisma.transaction.create({
            data: {
                id: rawTransaction.transactionHash,
                from: rawTransaction.from,
                to: rawTransaction.to,
                blockHash: rawTransaction.blockHash
            }
        }).then(async () => {
            await this.prisma.$disconnect()
        }).catch(async (e) => {
            await this.prisma.$disconnect()
        })
        //console.log("inserted")
    }
}
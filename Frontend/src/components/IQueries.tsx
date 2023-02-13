import React from 'react'

export type BitcoinTransaction = {
    id: string,
    timeStamp: string,
    txHex: string,
    blockNumber: string,
    blockHash: string,
    amount: string,
    gas: string,
    coinbase: string
}
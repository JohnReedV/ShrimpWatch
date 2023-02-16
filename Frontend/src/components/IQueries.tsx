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

interface BtcWallet {
    node: {
        outputsByPublicKey: {
            edges: {
                node: {
                    amount: number,
                    timeStamp: number
                }
            }[]
        }
        inputsByPublicKey: {
            edges: {
                node: {
                    amount: number,
                    timeStamp: number
                }
            }[]
        }
    }
}

export interface AllBtcWalletsQueryResult {
    allBtcWallets: {
        edges: BtcWallet[]
        totalCount: number
    }
}

export interface ShrimpPercentage {
    date: Date
    percentage: number
  }
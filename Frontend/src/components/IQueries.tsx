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

export interface ShrimpPercentage {
    timestamp: number,
    percentage: number
}

export interface ChartData {
    x: number
    y: number | null
}

export interface ShrimpData {
    data: {
        allInputs: {
            edges: {
                node: {
                    amount: number
                    timeStamp: number
                    publicKey: string
                };
            }[];
        };
        allOutputs: {
            edges: {
                node: {
                    amount: number
                    timeStamp: number
                    publicKey: string
                };
            }[];
        };
    };

}

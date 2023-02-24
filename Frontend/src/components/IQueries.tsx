import React from 'react'

export interface BtcTransaction {
    node: {
        id: string
        amount: number
        blockHash: string
        blockNumber: number
        gas: number
        timeStamp: number
    }
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
